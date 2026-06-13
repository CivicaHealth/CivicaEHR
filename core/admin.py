from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html

from .models import UserProfile
from .models import Patient
from .models import Encounter
from .models import SOAPNote
from .models import Vital
from .models import Diagnosis
from .models import Medication
from .models import Allergy
from .models import Document
from .models import Appointment
from .models import HIPAALog


# ── User + UserProfile ───────────────────────────────────────────────────────

class UserProfileInline(admin.StackedInline):
    model   = UserProfile
    can_delete = False
    verbose_name_plural = "Profile & Role"
    fields  = ("role", "title")
    extra   = 0



admin.site.unregister(User)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines        = (UserProfileInline,)
    list_display   = ("username", "email", "first_name", "last_name",
                      "get_role", "is_staff", "is_active")
    list_filter    = ("is_staff", "is_active", "userprofile__role")
    search_fields  = ("username", "email", "first_name", "last_name")

    @admin.display(description="Role")
    def get_role(self, obj):
        try:
            return obj.userprofile.get_role_display() or "—"
        except UserProfile.DoesNotExist:
            return "—"


class EncounterInline(admin.TabularInline):

    model = Encounter

    extra = 0


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "last_name",
        "first_name",
        "date_of_birth",
    )

    search_fields = (
        "first_name",
        "last_name",
    )

    inlines = [EncounterInline]


@admin.register(Encounter)
class EncounterAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "patient",
        "encounter_date",
        "reason_for_visit",
    )

    search_fields = (
        "patient__first_name",
        "patient__last_name",
        "reason_for_visit",
    )


@admin.register(SOAPNote)
class SOAPNoteAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "encounter",
        "created_at",
    )


admin.site.register(Vital)
admin.site.register(Diagnosis)
admin.site.register(Medication)
admin.site.register(Allergy)
admin.site.register(Document)
admin.site.register(Appointment)


# ── HIPAA Audit Log — read-only, immutable ────────────────────────────────────

@admin.register(HIPAALog)
class HIPAALogAdmin(admin.ModelAdmin):
    """
    HIPAA audit logs are read-only in the admin.
    No user — including superusers — can add, change, or delete entries
    through the admin interface.
    """

    list_display = (
        "timestamp",
        "action_badge",
        "username_snapshot",
        "patient",
        "model_name",
        "object_id",
        "ip_address",
        "extra_short",
    )

    list_filter  = ("action", "model_name")
    search_fields = ("username_snapshot", "object_repr", "ip_address", "extra")
    readonly_fields = [f.name for f in HIPAALog._meta.get_fields()
                       if hasattr(f, "name")]
    ordering = ("-timestamp",)
    date_hierarchy = "timestamp"

    # ── Block all mutations ───────────────────────────────────────────────────

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    # ── Display helpers ───────────────────────────────────────────────────────

    ACTION_COLORS = {
        "login_success": "#27ae60",
        "login_failure": "#e74c3c",
        "logout":        "#95a5a6",
        "view":          "#2980b9",
        "create":        "#8e44ad",
        "update":        "#e67e22",
        "delete":        "#c0392b",
    }

    @admin.display(description="Action")
    def action_badge(self, obj):
        color = self.ACTION_COLORS.get(obj.action, "#555")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:10px;font-size:11px;font-weight:600;">{}</span>',
            color,
            obj.get_action_display(),
        )

    @admin.display(description="Detail")
    def extra_short(self, obj):
        return obj.extra[:60] + "…" if len(obj.extra) > 60 else obj.extra
