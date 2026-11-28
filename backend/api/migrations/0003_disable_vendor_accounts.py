from django.db import migrations


def disable_vendor_accounts(apps, schema_editor):
    """The Vendor portal was removed. Switch off any vendor logins and revoke their tokens,
    so they can't reach staff data once the vendor-only restrictions are gone."""
    UserProfile = apps.get_model('api', 'UserProfile')
    Token = apps.get_model('authtoken', 'Token')
    User = apps.get_model('auth', 'User')

    user_ids = list(UserProfile.objects.filter(role='VENDOR').values_list('user_id', flat=True))
    if user_ids:
        User.objects.filter(pk__in=user_ids).update(is_active=False)
        Token.objects.filter(user_id__in=user_ids).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0002_excel_folders'),
        ('authtoken', '0004_alter_tokenproxy_options'),
    ]

    operations = [
        migrations.RunPython(disable_vendor_accounts, migrations.RunPython.noop),
    ]
