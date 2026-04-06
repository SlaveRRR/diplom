from rest_framework.views import exception_handler

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



def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return response

    request = context.get('request')
    path = request.path if request else ''
    if any(path.startswith(prefix) for prefix in EXCLUDED_RESPONSE_PREFIXES):
        return response

    response.data = {
        'data': None,
        'error': {
            'message': _extract_message(response.data),
        },
    }
    return response



def _extract_message(data):
    if isinstance(data, dict):
        if 'detail' in data:
            detail = data['detail']
            if isinstance(detail, list) and detail:
                return str(detail[0])
            return str(detail)
        if data:
            first_value = next(iter(data.values()))
            return _extract_message(first_value)
    if isinstance(data, list) and data:
        return _extract_message(data[0])
    if data is None:
        return 'Unknown error'
    return str(data)
