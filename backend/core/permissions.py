from rest_framework.permissions import BasePermission
from .models import User

class OrganizationRequired(BasePermission):
    message = "حساب المستخدم غير مرتبط بمنشأة نشطة."
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.organization_id and user.organization.is_active)

class RolePermission(BasePermission):
    allowed_roles = set()
    def has_permission(self, request, view):
        return request.user.is_authenticated and (not self.allowed_roles or request.user.role in self.allowed_roles)

class CanCollect(RolePermission):
    allowed_roles = {User.Role.COLLECTOR, User.Role.OWNER, User.Role.STAFF}
    def has_permission(self, request, view):
        if not super().has_permission(request, view): return False
        return request.user.role in {User.Role.OWNER, User.Role.STAFF} or request.user.can_collect_rent or request.user.can_collect_services
