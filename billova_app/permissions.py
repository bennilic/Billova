import logging

from django.contrib import messages
from rest_framework import permissions

# Create a logger for this module
logger = logging.getLogger(__name__)


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to view and edit it.
    """

    def has_object_permission(self, request, view, obj):
        try:
            # Check if the owner of the object matches the logged-in user
            is_owner = obj.owner == request.user
            if not is_owner:
                # Log the access attempt
                logger.warning(
                    f"Permission denied: User {request.user.username} "
                    f"tried to access {obj} owned by {obj.owner.username}."
                )
                # Add a message for the user
                messages.warning(
                    request,
                    f"You do not have permission to access this object."
                )
            else:
                # Log successful access
                logger.info(
                    f"Permission granted: User {request.user.username} accessed {obj}."
                )
            return is_owner

        except AttributeError as e:
            # Log the error if the object doesn't have an owner attribute
            logger.error(
                f"Error checking ownership for object {obj}: {e}",
                exc_info=True
            )
            # Optionally add a message for the user
            messages.error(
                request,
                "An error occurred while checking permissions. Please contact support."
            )
            return False

        except Exception as e:
            # Catch-all for unexpected errors
            logger.critical(
                f"Unexpected error in permission check for object {obj}: {e}",
                exc_info=True
            )
            # Add a generic error message for the user
            messages.error(
                request,
                "An unexpected error occurred. Please try again later."
            )
            return False
