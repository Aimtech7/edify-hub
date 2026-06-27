from django.contrib.admin.apps import AdminConfig


class HorizonAdminConfig(AdminConfig):
    default_site = 'config.admin_site.HorizonAdminSite'
