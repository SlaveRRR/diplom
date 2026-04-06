from rest_framework.renderers import JSONRenderer


EXCLUDED_RESPONSE_PREFIXES = (
    '/_allauth/',
    '/api/v1/signup/',
    '/api/v1/signin/',
    '/api/v1/token/refresh/',
    '/api/v1/logout/',
    '/api/v1/social/',
    '/api/v1/schema/',
    '/api/v1/docs/',
)


class ApiEnvelopeJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        request = renderer_context.get('request')
        path = request.path if request else ''

        if any(path.startswith(prefix) for prefix in EXCLUDED_RESPONSE_PREFIXES):
            return super().render(data, accepted_media_type, renderer_context)

        if isinstance(data, dict) and 'data' in data and 'error' in data:
            payload = data
        else:
            payload = {
                'data': data,
                'error': None,
            }

        return super().render(payload, accepted_media_type, renderer_context)
