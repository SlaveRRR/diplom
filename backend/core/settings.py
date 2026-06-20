import os
import importlib.util
from datetime import timedelta
from pathlib import Path

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(*args, **kwargs):
        return False


load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
MODE = os.getenv('MODE')
DEBUG = MODE == 'DEV'
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)

def get_env_list(name: str, default: str = ''):
    raw = os.getenv(name, default)

    return [item.strip() for item in raw.split(',') if item.strip()]


ALLOWED_HOSTS = ['localhost', '127.0.0.1'] if MODE == 'DEV' else get_env_list(
    'ALLOWED_HOSTS',
    'localhost',
)
CORS_ALLOWED_ORIGINS = ['http://localhost:5173'] if MODE == 'DEV' else get_env_list(
    'CORS_ALLOWED_ORIGINS',
    os.getenv('FRONTEND_URL', 'http://localhost:5173'),
)
CORS_ALLOW_CREDENTIALS = True
REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'
AUTH_USER_MODEL = 'users.User'
HEADLESS_ONLY = True
HEADLESS_FRONTEND_URLS = {
    'account_confirm_email': f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/account/verify-email/{{key}}",
    'account_reset_password_from_key': f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/account/password/reset/{{key}}",
    'account_signup': f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/signup",
    'socialaccount_login_error': f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/signin",
}

BACKEND_PUBLIC_URL = os.getenv(
    'BACKEND_PUBLIC_URL',
    'http://localhost:8000',
).rstrip('/')
ADMINS_EMAILS = get_env_list('ADMINS_EMAILS')

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
).rstrip("/")

CSRF_TRUSTED_ORIGINS = ['http://localhost:8000'] if MODE == 'DEV' else get_env_list(
    'CSRF_TRUSTED_ORIGINS',
    os.getenv('FRONTEND_URL', 'http://localhost:5173'),
)
ACCOUNT_DEFAULT_HTTP_PROTOCOL = 'http' if MODE == 'DEV' else 'https'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

S3_ENDPOINT_URL = os.getenv('S3_ENDPOINT_URL')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')
S3_ACCESS_KEY_ID = os.getenv('S3_ACCESS_KEY_ID')
S3_SECRET_ACCESS_KEY = os.getenv('S3_SECRET_ACCESS_KEY') 
S3_REGION_NAME = os.getenv('S3_REGION_NAME')
S3_PRESIGNED_EXPIRATION = int(os.getenv('S3_PRESIGNED_EXPIRATION'))
S3_PUBLIC_BASE_URL = os.getenv('S3_PUBLIC_BASE_URL', '')

INSTALLED_APPS = [
    'daphne',
    'channels',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'verify_email.apps.VerifyEmailConfig',
    'allauth',
    'allauth.account',
    'allauth.headless',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.vk',
    'allauth.socialaccount.providers.yandex',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'authentication',
    'analytics',
    'blog',
    'comics',
    'interactions',
    'users',
]

SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
     "whitenoise.middleware.WhiteNoiseMiddleware",
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'core.middleware.ApiRequestLoggingMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

ROOT_URLCONF = 'core.urls'
ASGI_APPLICATION = 'core.asgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [
                (
                    os.getenv('REDIS_HOST', 'redis'),
                    int(os.getenv('REDIS_PORT', '6379')),
                )
            ],
        },
    }
}
CHANNEL_GROUP_SEND_TIMEOUT_SECONDS = float(os.getenv('CHANNEL_GROUP_SEND_TIMEOUT_SECONDS', '1.5'))
NOTIFICATION_REALTIME_FANOUT_LIMIT = int(os.getenv('NOTIFICATION_REALTIME_FANOUT_LIMIT', '25'))
CELERY_BROKER_URL = os.getenv(
    'CELERY_BROKER_URL',
    f"redis://{os.getenv('REDIS_HOST', 'redis')}:{os.getenv('REDIS_PORT', '6379')}/1",
)
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', CELERY_BROKER_URL)
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = int(os.getenv('CELERY_TASK_TIME_LIMIT', '300'))
CELERY_TASK_SOFT_TIME_LIMIT = int(os.getenv('CELERY_TASK_SOFT_TIME_LIMIT', '240'))

REDIS_CACHE_URL = os.getenv(
    'REDIS_CACHE_URL',
    f"redis://{os.getenv('REDIS_HOST', 'redis')}:{os.getenv('REDIS_PORT', '6379')}/2",
)

if importlib.util.find_spec('django_redis'):
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_CACHE_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            },
            'KEY_PREFIX': os.getenv('CACHE_KEY_PREFIX', 'comicsera'),
        },
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'comicsera-local-cache',
        },
    }

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'PORT': os.getenv('DB_PORT', 5432),
         'NAME': os.getenv('DB_NAME'),
    }
}

if MODE == 'DEV':
    DATABASES['default'].update({
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'root'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
    })
else:
    DATABASES['default'].update({
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'root'),
    })

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
)
SOCIALACCOUNT_ADAPTER = 'authentication.adapters.SocialAccountAdapter'

EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = os.getenv('EMAIL_HOST', '')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '465'))
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'true').lower() == 'true'
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'false').lower() == 'true'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

LOGIN_URL = f"{os.getenv('FRONTEND_URL').rstrip('/')}/signin?verification=success"
VERIFICATION_SUCCESS_TEMPLATE = None
EXPIRE_AFTER = os.getenv('VERIFY_EMAIL_EXPIRE_AFTER', '15m')
MAX_RETRIES = int(os.getenv('VERIFY_EMAIL_MAX_RETRIES', '5'))

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
CELERY_TIMEZONE = TIME_ZONE


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': os.getenv('DRF_THROTTLE_ANON', '120/min'),
        'user': os.getenv('DRF_THROTTLE_USER', '600/min'),
        'auth': os.getenv('DRF_THROTTLE_AUTH', '10/min'),
        'signup': os.getenv('DRF_THROTTLE_SIGNUP', '5/hour'),
        'verification_email': os.getenv('DRF_THROTTLE_VERIFICATION_EMAIL', '3/hour'),
        'social_auth': os.getenv('DRF_THROTTLE_SOCIAL_AUTH', '20/min'),
        'upload_config': os.getenv('DRF_THROTTLE_UPLOAD_CONFIG', '30/hour'),
        'upload_confirm': os.getenv('DRF_THROTTLE_UPLOAD_CONFIRM', '60/hour'),
        'comment': os.getenv('DRF_THROTTLE_COMMENT', '30/hour'),
        'interaction': os.getenv('DRF_THROTTLE_INTERACTION', '120/hour'),
        'rating': os.getenv('DRF_THROTTLE_RATING', '60/hour'),
        'reading_progress': os.getenv('DRF_THROTTLE_READING_PROGRESS', '600/hour'),
        'analytics_export': os.getenv('DRF_THROTTLE_ANALYTICS_EXPORT', '10/hour'),
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'core.renderers.ApiEnvelopeJSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'EXCEPTION_HANDLER': 'core.exceptions.api_exception_handler',
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name}: {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'django.log',
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 5,
            'formatter': 'verbose',
            'encoding': 'utf-8',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'core': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'api.requests': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'authentication': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'analytics': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'blog': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'comics': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'interactions': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'users': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'ComicsApp API',
    'DESCRIPTION': 'API for comics reading and publishing platform',
    'VERSION': '1.0.0',
    'TAGS': [
        {'name': 'Authentication', 'description': 'Authentication and token management endpoints'},
        {'name': 'Users', 'description': 'Current user profile endpoints'},
        {'name': 'Comics', 'description': 'Comics domain endpoints'},
        {'name': 'Interactions', 'description': 'Comments, likes and favorites endpoints'},
        {'name': 'Blog', 'description': 'Blog posts, tags, uploads and comments endpoints'},
        {'name': 'Analytics', 'description': 'Author analytics dashboard and report export endpoints'},
    ],
}

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APPS': [
            {
                'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                'secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                'settings': {
                    'scope': ['profile', 'email'],
                },
            }
        ]
    },
    'vk': {
        'APPS': [
            {
                'client_id': os.getenv('VK_CLIENT_ID'),
                'secret': os.getenv('VK_CLIENT_SECRET'),
                'key': os.getenv('VK_CLIENT_KEY', ''),
            }
        ],
        'SCOPE': ['email'],
    },
    'yandex': {
        'APPS': [
            {
                'client_id': os.getenv('YANDEX_CLIENT_ID'),
                'secret': os.getenv('YANDEX_CLIENT_SECRET'),
                'settings': {
                    'scope': ['login:avatar','login:email'],
                },
            }
        ]
    },
}

