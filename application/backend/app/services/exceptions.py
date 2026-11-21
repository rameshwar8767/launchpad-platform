from typing import Any, Dict, List, Optional


class AppException(Exception):
    """Base application exception for centralized error handling."""
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[List[Dict[str, Any]]] = None,
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or []
        super().__init__(message)


class EntityNotFoundException(AppException):
    def __init__(self, entity_name: str, identifier: Any):
        super().__init__(
            status_code=404,
            code="RESOURCE_NOT_FOUND",
            message=f"{entity_name} with identifier '{identifier}' was not found.",
        )


class PermissionDeniedException(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(
            status_code=403,
            code="PERMISSION_DENIED",
            message=message,
        )


class DuplicateResourceException(AppException):
    def __init__(self, message: str = "A resource with these attributes already exists."):
        super().__init__(
            status_code=409,
            code="DUPLICATE_RESOURCE",
            message=message,
        )


class InvalidCredentialsException(AppException):
    def __init__(self, message: str = "Invalid email or password."):
        super().__init__(
            status_code=401,
            code="INVALID_CREDENTIALS",
            message=message,
        )


class TokenValidationException(AppException):
    def __init__(self, message: str = "Authentication token is invalid or expired."):
        super().__init__(
            status_code=401,
            code="TOKEN_VALIDATION_ERROR",
            message=message,
        )
