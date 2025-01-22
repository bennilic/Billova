import logging

from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserSettings

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    if created:  # Ensure it's a new user, not an update
        try:
            UserSettings.objects.create(owner=instance)
            logger.info(f"UserSettings created for new user: {instance.username}")
        except Exception as e:
            logger.error(f"Error creating UserSettings for user {instance.username}: {e}")
