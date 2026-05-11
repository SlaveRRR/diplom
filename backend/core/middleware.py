import logging
import time

logger = logging.getLogger('api.requests')


class ApiRequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith('/api/'):
            return self.get_response(request)

        started_at = time.perf_counter()
        response = self.get_response(request)
        duration_ms = (time.perf_counter() - started_at) * 1000

        user = getattr(request, 'user', None)
        user_id = user.id if user and user.is_authenticated else 'anonymous'

        logger.info(
            'API request method=%s path=%s status=%s duration_ms=%.2f user_id=%s',
            request.method,
            request.path,
            response.status_code,
            duration_ms,
            user_id,
        )
        return response
