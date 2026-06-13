"""
core/audit.py

Central HIPAA audit logging utilities.

Usage:
    from core.audit import log_action

    log_action(
        request  = request,        # HttpRequest (for user + IP)
        action   = "view",         # see HIPAALog.ACTION_CHOICES
        instance = patient,        # any model instance (optional)
        patient  = patient,        # explicit Patient FK (optional)
        extra    = "some detail",  # free-text (optional)
    )
"""

from __future__ import annotations

import json
import logging

logger = logging.getLogger("hipaa")


def _get_ip(request) -> str | None:
    """Extract real client IP, respecting X-Forwarded-For."""
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _resolve_patient(instance):
    """
    Walk common FK relationships to find the associated Patient.
    Returns a Patient instance or None.
    """
    from core.models import Patient

    if isinstance(instance, Patient):
        return instance

    # Direct patient FK
    if hasattr(instance, "patient") and instance.patient is not None:
        return instance.patient

    # Via encounter
    if hasattr(instance, "encounter") and instance.encounter is not None:
        enc = instance.encounter
        if hasattr(enc, "patient") and enc.patient is not None:
            return enc.patient

    return None


def log_action(
    request=None,
    action: str = "view",
    instance=None,
    patient=None,
    extra: str = "",
    user=None,
    ip_address: str | None = None,
):
    """
    Create an immutable HIPAALog entry.
    Safe to call from anywhere; swallows exceptions so audit
    failures never break the main request flow.
    """
    try:
        from core.models import HIPAALog

        # Resolve user
        _user = user
        _username = ""
        if _user is None and request is not None:
            _user = getattr(request, "user", None)
            if _user and not _user.is_authenticated:
                _user = None
        if _user:
            _username = _user.username

        # Resolve IP
        _ip = ip_address
        if _ip is None and request is not None:
            _ip = _get_ip(request)

        # Resolve patient
        _patient = patient
        if _patient is None and instance is not None:
            _patient = _resolve_patient(instance)

        # Resolve model/object info — never store patient names in repr
        _model  = ""
        _obj_id = ""
        _repr   = ""
        if instance is not None:
            _model  = instance.__class__.__name__
            _obj_id = str(instance.pk) if instance.pk else ""
            _repr   = str(instance)[:255]

        HIPAALog(
            user              = _user,
            username_snapshot = _username,
            action            = action,
            model_name        = _model,
            object_id         = _obj_id,
            object_repr       = _repr,
            patient           = _patient,
            ip_address        = _ip,
            extra             = extra,
        ).save()

    except Exception:
        logger.exception("Failed to write HIPAA audit log")


# ── Idle Timeout Middleware ────────────────────────────────────────────────────

class IdleTimeoutMiddleware:
    """
    True server-side idle timeout.
    Stores last_activity timestamp in the session on every authenticated request.
    If inactivity exceeds IDLE_TIMEOUT_SECONDS, flushes the session and redirects
    to the login page — regardless of cookie state.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.conf import settings
        from django.contrib.auth import logout
        from django.shortcuts import redirect
        import time

        timeout = getattr(settings, 'IDLE_TIMEOUT_SECONDS', 900)

        if request.user.is_authenticated:
            last = request.session.get('last_activity')
            now  = time.time()

            if last and (now - last) > timeout:
                # Session has been idle too long — force logout
                logout(request)
                login_url = getattr(settings, 'LOGIN_URL', '/accounts/login/')
                return redirect(f"{login_url}?next={request.path}&reason=timeout")

            # Update last activity on every authenticated request
            request.session['last_activity'] = now
            request.session.modified = True

        return self.get_response(request)


# ── HIPAA Middleware ───────────────────────────────────────────────────────────

class HIPAAMiddleware:
    """
    - Sets no-cache headers on all authenticated responses so the browser
      never stores PHI pages in its back/forward cache.
    - Logs views of patient detail pages.
    """

    PATIENT_DETAIL_PATH = "/patients/"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Prevent browser from caching any authenticated page.
        # This stops the back button from restoring a stale PHI page
        # without hitting the server.
        if hasattr(request, 'user') and request.user.is_authenticated:
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
            response['Pragma']        = 'no-cache'
            response['Expires']       = '0'

        # Log patient record views (GET only, successful responses)
        if (
            request.method == "GET"
            and response.status_code == 200
            and self._is_patient_detail(request.path)
        ):
            patient_id = self._extract_patient_id(request.path)
            if patient_id:
                try:
                    from core.models import Patient
                    patient = Patient.objects.get(pk=patient_id)
                    log_action(
                        request  = request,
                        action   = "view",
                        instance = patient,
                        patient  = patient,
                        extra    = f"GET {request.path}",
                    )
                except Exception:
                    pass

        return response

    @staticmethod
    def _is_patient_detail(path: str) -> bool:
        import re
        return bool(re.match(r"^/patients/\d+/$", path))

    @staticmethod
    def _extract_patient_id(path: str):
        import re
        m = re.match(r"^/patients/(\d+)/$", path)
        return int(m.group(1)) if m else None


# ── Django auth signals ────────────────────────────────────────────────────────

from django.contrib.auth.signals import (
    user_logged_in,
    user_logged_out,
    user_login_failed,
)
from django.dispatch import receiver


@receiver(user_logged_in)
def on_login_success(sender, request, user, **kwargs):
    log_action(
        request  = request,
        action   = "login_success",
        user     = user,
        extra    = f"Login from {_get_ip(request)}",
    )


@receiver(user_logged_out)
def on_logout(sender, request, user, **kwargs):
    log_action(
        request  = request,
        action   = "logout",
        user     = user,
        extra    = f"Logout from {_get_ip(request)}",
    )


@receiver(user_login_failed)
def on_login_failure(sender, credentials, request, **kwargs):
    log_action(
        request  = request,
        action   = "login_failure",
        extra    = f"Failed login for username='{credentials.get('username', '')}' from {_get_ip(request)}",
    )
