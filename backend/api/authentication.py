from rest_framework.authentication import TokenAuthentication


class BearerTokenAuthentication(TokenAuthentication):
    """Accepts `Authorization: Bearer <token>`, which is what the frontend sends."""

    keyword = 'Bearer'
