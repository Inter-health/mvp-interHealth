from enum import Enum


class AuditAction(str, Enum):
    USER_CREATED = "USER_CREATED"
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    EMAIL_VERIFIED = "EMAIL_VERIFIED"
