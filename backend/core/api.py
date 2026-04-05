from rest_framework.response import Response


def success_response(data, status_code):
    return Response(
        {
            'data': data,
            'error': None,
        },
        status=status_code,
    )



def error_response(message, status_code, extra=None):
    payload = {
        'data': None,
        'error': {
            'message': message,
        },
    }

    if extra:
        payload['error'].update(extra)

    return Response(payload, status=status_code)
