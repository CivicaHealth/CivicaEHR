from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY")
#SECRET_KEY = "dev-secret-key"

DEBUG = os.getenv("DEBUG") == "True"

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "core",
    
    'encrypted_model_fields',
]

FIELD_ENCRYPTION_KEY = os.getenv('FIELD_ENCRYPTION_KEY')
#FIELD_ENCRYPTION_KEY = "G9QUX4dDqqn0C1XQeDr21oH9AT3kACYkPShDc4N6Q_M="

# IP header to use for rate limiting behind a reverse proxy
# RATELIMIT_IP_META_KEY = 'HTTP_X_FORWARDED_FOR'  # uncomment if behind nginx/load balancer

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "core.audit.HIPAAMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "core.audit.IdleTimeoutMiddleware",    # ← must be AFTER AuthenticationMiddleware
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "hipaa": {
            "format": "[HIPAA] {asctime} {levelname} {message}",
            "style":  "{",
        },
    },
    "handlers": {
        "hipaa_file": {
            "class":     "logging.FileHandler",
            "filename":  BASE_DIR / "logs" / "hipaa_audit.log",
            "formatter": "hipaa",
            "level":     "WARNING",   # only audit failures go to file
        },
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "hipaa": {
            "handlers": ["hipaa_file", "console"],
            "level":    "WARNING",
            "propagate": False,
        },
    },
}

ROOT_URLCONF = "ehr.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "ehr.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT"),
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"

TIME_ZONE = "America/Los_Angeles"

USE_I18N = True

USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/accounts/login/"

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"

# ── Session Security ──────────────────────────────────────────────────────────

# Idle timeout: kill session after 15 minutes of inactivity
IDLE_TIMEOUT_SECONDS = 900          # 15 minutes — change to 9 to test
 
# Keep these as belt-and-suspenders:
SESSION_EXPIRE_AT_BROWSER_CLOSE = True  # Kill cookie when browser closes
SESSION_COOKIE_AGE = 86400              # 24hr hard max (IdleTimeoutMiddleware
                                        # will log out inactive users well before this)
                                        

# Cookie security: prevent interception and JS access
SESSION_COOKIE_SECURE = True       # HTTPS only — set to False in local dev if not using HTTPS
SESSION_COOKIE_HTTPONLY = True     # Block JavaScript from reading the session cookie
SESSION_COOKIE_SAMESITE = 'Lax'   # CSRF protection: don't send cookie on cross-site requests

# CSRF cookie security
CSRF_COOKIE_SECURE = True          # HTTPS only
CSRF_COOKIE_HTTPONLY = True        # Block JavaScript from reading the CSRF cookie

# Only enable secure cookies if NOT in debug mode
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG

# ── Strong Password Validation ────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {
        # Rejects passwords too similar to username, email, first/last name
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        'OPTIONS': {'max_similarity': 0.5},
    },
    {
        # Minimum 12 characters
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 12},
    },
    {
        # Rejects passwords on the list of 20,000 most common passwords
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        # Rejects entirely numeric passwords
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ── Rate Limiting ─────────────────────────────────────────────────────────────
# Brute-force protection is implemented in core/views.py (secure_login)
# using the LoginAttempt model backed by PostgreSQL.
# No external cache or additional package required.
#
# Limits: 5 failed attempts per IP or username within 5 minutes.
# On breach: returns 429, logs to HIPAALog, disables the login form.
