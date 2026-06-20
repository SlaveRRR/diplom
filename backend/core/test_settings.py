from .settings import *  # noqa: F403,F401

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test.sqlite3',  # noqa: F405
    }
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'comicsera-test-cache',
    },
}

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10000/min',
        'user': '10000/min',
        'auth': '10000/min',
        'signup': '10000/hour',
        'verification_email': '10000/hour',
        'social_auth': '10000/min',
        'upload_config': '10000/hour',
        'upload_confirm': '10000/hour',
        'comment': '10000/hour',
        'interaction': '10000/hour',
        'rating': '10000/hour',
        'reading_progress': '10000/hour',
        'analytics_export': '10000/hour',
    },
}
