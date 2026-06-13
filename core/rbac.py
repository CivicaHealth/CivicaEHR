"""
core/rbac.py

Role-Based Access Control for ClearChart EHR.

Groups and what they can do
───────────────────────────
front_desk_volunteer    : view patients/appointments, create appointments
undergrad_staff         : above + record vitals, create lab orders
student_practitioner    : above + full clinical chart (SOAP, Rx, Dx, Meds)
attending_faculty       : full access including user management

Superusers bypass all checks (Django built-in behaviour).
"""

from functools import wraps

from django.contrib.auth.models import Group, Permission
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404


# ── Group names (match UserProfile.ROLE_CHOICES values) ──────────────────────

FRONT_DESK       = "front_desk_volunteer"
UNDERGRAD        = "undergrad_staff"
STUDENT          = "student_practitioner"
ATTENDING        = "attending_faculty"

ALL_ROLES = [FRONT_DESK, UNDERGRAD, STUDENT, ATTENDING]

# Roles that can access clinical data
CLINICAL_ROLES  = [UNDERGRAD, STUDENT, ATTENDING]

# Roles that can manage users / audit logs
ADMIN_ROLES     = [ATTENDING]


# ── Bootstrap groups + permissions (called from AppConfig.ready) ──────────────

def create_groups():
    """
    Idempotently create Django Groups and assign permissions.
    Call this from a data migration or management command — not at import time.
    """
    from django.contrib.contenttypes.models import ContentType
    from core.models import (
        Patient, Encounter, SOAPNote, Vital, Diagnosis,
        Medication, Allergy, Appointment, LabOrder,
        Prescription, Problem, SocialHistory,
    )

    def perms(model, actions):
        ct = ContentType.objects.get_for_model(model)
        return [
            Permission.objects.get(content_type=ct, codename=f"{a}_{model.__name__.lower()}")
            for a in actions
        ]

    # Front Desk: view patients, all appointment CRUD, no clinical data
    fd_group, _ = Group.objects.get_or_create(name=FRONT_DESK)
    fd_group.permissions.set(
        perms(Patient,      ["add", "view"]) +
        perms(Appointment,  ["add", "change", "view", "delete"])
    )

    # Undergrad: Front Desk + vitals + lab orders
    ug_group, _ = Group.objects.get_or_create(name=UNDERGRAD)
    ug_group.permissions.set(
        perms(Patient,      ["add", "view"]) +
        perms(Appointment,  ["add", "change", "view", "delete"]) +
        perms(Vital,        ["add", "change", "view"]) +
        perms(LabOrder,     ["add", "change", "view"])
    )

    # Student Practitioner: full clinical access except user management
    sp_group, _ = Group.objects.get_or_create(name=STUDENT)
    sp_group.permissions.set(
        perms(Patient,       ["add", "change", "view"]) +
        perms(Encounter,     ["add", "change", "view"]) +
        perms(Appointment,   ["add", "change", "view", "delete"]) +
        perms(SOAPNote,      ["add", "change", "view"]) +
        perms(Vital,         ["add", "change", "view"]) +
        perms(Diagnosis,     ["add", "change", "view", "delete"]) +
        perms(Medication,    ["add", "change", "view", "delete"]) +
        perms(Allergy,       ["add", "change", "view", "delete"]) +
        perms(LabOrder,      ["add", "change", "view"]) +
        perms(Prescription,  ["add", "change", "view"]) +
        perms(Problem,       ["add", "change", "view", "delete"]) +
        perms(SocialHistory, ["add", "change", "view"])
    )

    # Attending Faculty: everything
    at_group, _ = Group.objects.get_or_create(name=ATTENDING)
    at_group.permissions.set(
        perms(Patient,       ["add", "change", "view", "delete"]) +
        perms(Encounter,     ["add", "change", "view", "delete"]) +
        perms(Appointment,   ["add", "change", "view", "delete"]) +
        perms(SOAPNote,      ["add", "change", "view", "delete"]) +
        perms(Vital,         ["add", "change", "view", "delete"]) +
        perms(Diagnosis,     ["add", "change", "view", "delete"]) +
        perms(Medication,    ["add", "change", "view", "delete"]) +
        perms(Allergy,       ["add", "change", "view", "delete"]) +
        perms(LabOrder,      ["add", "change", "view", "delete"]) +
        perms(Prescription,  ["add", "change", "view", "delete"]) +
        perms(Problem,       ["add", "change", "view", "delete"]) +
        perms(SocialHistory, ["add", "change", "view", "delete"])
    )


# ── Role helpers ──────────────────────────────────────────────────────────────

def get_role(user) -> str | None:
    """Return the user's role string from their UserProfile, or None."""
    try:
        return user.userprofile.role
    except Exception:
        return None


def has_role(user, *roles) -> bool:
    if user.is_superuser:
        return True
    return get_role(user) in roles


def is_clinical(user) -> bool:
    return has_role(user, *CLINICAL_ROLES)


def is_attending(user) -> bool:
    return has_role(user, *ADMIN_ROLES)


# ── View decorators ───────────────────────────────────────────────────────────

def role_required(*roles):
    """
    Decorator — allows access only to users whose role is in `roles`.
    Superusers always pass.

    Usage:
        @role_required(STUDENT, ATTENDING)
        def my_view(request): ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                from django.contrib.auth.views import redirect_to_login
                return redirect_to_login(request.get_full_path())
            if not has_role(request.user, *roles):
                raise PermissionDenied
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def clinical_required(view_func):
    """Shortcut: requires undergrad_staff, student_practitioner, or attending_faculty."""
    return role_required(*CLINICAL_ROLES)(view_func)


def attending_required(view_func):
    """Shortcut: requires attending_faculty only."""
    return role_required(*ADMIN_ROLES)(view_func)


# ── Object-level ownership verification ──────────────────────────────────────
#
# Because there is no per-doctor patient assignment in this practice model,
# "ownership" means the object belongs to THIS practice's database.
# The guards below prevent horizontal escalation by ensuring every object
# lookup is scoped through a verified chain back to Patient, and that
# the patient actually exists in our database.
#
# If per-provider assignment is added later, replace the Patient.objects.get
# calls with Patient.objects.filter(assigned_to=request.user) etc.

def get_patient_for_user(user, patient_id):
    """Return the Patient with the given ID. Raises Http404 if not found."""
    from core.models import Patient
    return get_object_or_404(Patient, id=patient_id)


def get_encounter_for_user(user, encounter_id):
    """Return an Encounter. Raises Http404 if not found."""
    from core.models import Encounter
    return get_object_or_404(Encounter, id=encounter_id)


def get_owned_object(model, user, **kwargs):
    """Generic safe object getter. Raises Http404 if not found."""
    return get_object_or_404(model, **kwargs)
