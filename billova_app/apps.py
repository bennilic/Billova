from django.apps import AppConfig


class BillovaAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'billova_app'

    def ready(self):
        import billova_app.signals  # Ensure signals are imported
