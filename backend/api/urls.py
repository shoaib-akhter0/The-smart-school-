from django.urls import re_path

from . import views
from .services import STUDENT, VENDOR


def route(pattern, view, name):
    """The frontend omits trailing slashes; accept the path with or without one."""
    return re_path(rf'^{pattern}/?$', view, name=name)


def record_routes(prefix, kind):
    return [
        route(prefix, views.FinancialRecordListView.as_view(kind=kind), f'{kind.key}-records'),
        route(rf'{prefix}/(?P<pk>[^/]+)', views.FinancialRecordDetailView.as_view(kind=kind), f'{kind.key}-record'),
        route(rf'{prefix}/(?P<pk>[^/]+)/flag', views.FinancialRecordFlagView.as_view(kind=kind), f'{kind.key}-flag'),
        route(rf'{prefix}/(?P<pk>[^/]+)/revision', views.FinancialRecordRevisionView.as_view(kind=kind),
              f'{kind.key}-revision'),
        route(rf'{prefix}/(?P<pk>[^/]+)/payments', views.FinancialRecordPaymentView.as_view(kind=kind),
              f'{kind.key}-payments'),
    ]


urlpatterns = [
    route('health', views.HealthView.as_view(), 'health'),

    route('auth/login', views.LoginView.as_view(), 'auth-login'),
    route('auth/logout', views.LogoutView.as_view(), 'auth-logout'),
    route('auth/current-user', views.CurrentUserView.as_view(), 'auth-current-user'),
    route('auth/users', views.UserListView.as_view(), 'auth-users'),
    route('auth/switch-role', views.SwitchRoleView.as_view(), 'auth-switch-role'),
    route('auth/change-password', views.ChangePasswordView.as_view(), 'auth-change-password'),
    route('auth/profile', views.ProfileView.as_view(), 'auth-profile'),
    route('users/manage', views.UserManageView.as_view(), 'users-manage'),

    route('dashboard/summary', views.DashboardSummaryView.as_view(), 'dashboard-summary'),

    # Must precede the `<pk>` patterns so "list" isn't treated as an id.
    route('students/list', views.StudentListView.as_view(), 'students-list'),
    route('vendors/list', views.VendorListView.as_view(), 'vendors-list'),
    *record_routes('students/fees', STUDENT),
    *record_routes('vendors/invoices', VENDOR),

    route('payments', views.PaymentListView.as_view(), 'payments'),
    route('audit-logs', views.AuditLogListView.as_view(), 'audit-logs'),
    route('settings', views.SettingsView.as_view(), 'settings'),
    route('notifications', views.NotificationListView.as_view(), 'notifications'),
    route(r'notifications/(?P<pk>[^/]+)/read', views.NotificationReadView.as_view(), 'notification-read'),
    route('import/commit', views.ImportCommitView.as_view(), 'import-commit'),

    route('excel-folders', views.ExcelFolderListView.as_view(), 'excel-folders'),
    route(r'excel-folders/(?P<pk>[^/]+)', views.ExcelFolderDetailView.as_view(), 'excel-folder'),
    route(r'excel-folders/(?P<pk>[^/]+)/download', views.ExcelFolderDownloadView.as_view(), 'excel-folder-download'),
]
