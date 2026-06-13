from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from core import views as core_views

handler403 = 'core.views.handler403'

urlpatterns = [
    path("admin/", admin.site.urls),

    # Rate-limited login — must come BEFORE the accounts/ include
    path("accounts/login/", core_views.secure_login, name="login"),
    
    path("accounts/logout/", core_views.logout_with_next,  name="logout"),

    # Remaining auth URLs (logout, password reset, etc.)
    path("accounts/", include("django.contrib.auth.urls")),

    path("", include("core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
