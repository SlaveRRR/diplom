import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from channels.routing import ProtocolTypeRouter, URLRouter
from django.conf import settings
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler
from django.core.asgi import get_asgi_application

from interactions.routing import websocket_urlpatterns
from interactions.ws_auth import JwtQueryStringAuthMiddlewareStack

django_asgi_application = get_asgi_application()
http_application = ASGIStaticFilesHandler(django_asgi_application) if settings.DEBUG else django_asgi_application

application = ProtocolTypeRouter(
    {
        'http': http_application,
        'websocket': JwtQueryStringAuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
