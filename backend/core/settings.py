import os
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

ALLOWED_HOSTS = ['localhost', '127.0.0.1'] if MODE == 'DEV' else [os.getenv('FRONTEND_HOST', 'localhost')]
CORS_ALLOWED_ORIGINS = ['http://localhost:5173'] if MODE == 'DEV' else [os.getenv('FRONTEND_URL', 'http://localhost:5173')]
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

S3_ENDPOINT_URL = os.getenv('S3_ENDPOINT_URL')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')
S3_ACCESS_KEY_ID = os.getenv('S3_ACCESS_KEY_ID')
S3_SECRET_ACCESS_KEY = os.getenv('S3_SECRET_ACCESS_KEY') 
S3_REGION_NAME = os.getenv('S3_REGION_NAME')
S3_PRESIGNED_EXPIRATION = int(os.getenv('S3_PRESIGNED_EXPIRATION'))
S3_PUBLIC_BASE_URL = os.getenv('S3_PUBLIC_BASE_URL', '')

INSTALLED_APPS = [
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
    'allauth.socialaccount.providers.yandex',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'authentication',
    'blog',
    'comics',
    'interactions',
    'users',
]

SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', '')
EMAIL_PORT = 465
EMAIL_USE_SSL = True
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

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'core.renderers.ApiEnvelopeJSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'EXCEPTION_HANDLER': 'core.exceptions.api_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'ComicsHub API',
    'DESCRIPTION': 'API for comics reading and publishing platform',
    'VERSION': '1.0.0',
    'TAGS': [
        {'name': 'Authentication', 'description': 'Authentication and token management endpoints'},
        {'name': 'Users', 'description': 'Current user profile endpoints'},
        {'name': 'Comics', 'description': 'Comics domain endpoints'},
        {'name': 'Interactions', 'description': 'Comments, likes and favorites endpoints'},
        {'name': 'Blog', 'description': 'Blog posts, tags, uploads and comments endpoints'},
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
    'yandex': {
        'APPS': [
            {
                'client_id': os.getenv('YANDEX_CLIENT_ID'),
                'secret': os.getenv('YANDEX_CLIENT_SECRET'),
                'settings': {
                    'scope': ['login:avatar'],
                },
            }
        ]
    },
}
