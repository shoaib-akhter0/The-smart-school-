from rest_framework import status

from .exceptions import ApiError
from .models import UserRole


def role_of(user):
    profile = getattr(user, 'profile', None)
    return profile.role if profile else None


def require_role(user, roles, message):
    """Raise a 403 `{"error": message}` unless the user has one of `roles`."""
    if role_of(user) not in roles:
        raise ApiError(message, status.HTTP_403_FORBIDDEN)


# Messages kept identical to the mock server the frontend was built against.
GM_EDIT_BLOCKED = (
    'CRITICAL SECURITY VIOLATION: The GM can view and monitor financial records, but CANNOT edit or '
    'overwrite original financial records uploaded by the Accountant. Request a correction or flag '
    'the record instead.'
)
GM_DELETE_BLOCKED = (
    'CRITICAL SECURITY VIOLATION: The GM cannot delete original financial records uploaded by the Accountant.'
)


def require_original_editor(user, deleting=False):
    """Only the Accountant may edit/delete originals; the GM gets an explicit violation message."""
    role = role_of(user)
    if role == UserRole.GM:
        raise ApiError(GM_DELETE_BLOCKED if deleting else GM_EDIT_BLOCKED, status.HTTP_403_FORBIDDEN)
    if role != UserRole.ACCOUNTANT:
        message = (
            'Unauthorized to delete financial records.' if deleting
            else 'Only the Accountant can directly edit original records. HOD must use the revision workflow.'
        )
        raise ApiError(message, status.HTTP_403_FORBIDDEN)
