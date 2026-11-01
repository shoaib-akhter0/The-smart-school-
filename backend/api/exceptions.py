from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException, AuthenticationFailed, NotAuthenticated, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler


class ApiError(APIException):
    """Raise anywhere in a view to return `{"error": message}` with the given status."""

    def __init__(self, message, status_code=status.HTTP_400_BAD_REQUEST):
        self.status_code = status_code
        super().__init__(detail=message)


def _flatten(detail):
    if isinstance(detail, dict):
        parts = []
        for key, value in detail.items():
            text = _flatten(value)
            parts.append(text if key in ('non_field_errors', 'detail') else f'{key}: {text}')
        return ' '.join(parts)
    if isinstance(detail, (list, tuple)):
        return ' '.join(_flatten(item) for item in detail)
    return str(detail)


def error_exception_handler(exc, context):
    """Every error response uses the `{"error": "..."}` shape the frontend reads."""
    if isinstance(exc, DjangoValidationError):
        exc = ValidationError(exc.messages)
    if isinstance(exc, Http404):
        return Response({'error': 'Record not found.'}, status=status.HTTP_404_NOT_FOUND)

    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        message = 'Authentication required. Please sign in again.'
    else:
        message = _flatten(response.data)
    response.data = {'error': message}
    return response
