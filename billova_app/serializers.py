import logging

from django.contrib.auth.models import User
from rest_framework import serializers, status
from rest_framework.response import Response

from billova_app.models import Expense, UserSettings, Category

logger = logging.getLogger(__name__)


class CategorySerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Category
        fields = ['url', 'id', 'name', 'owner']

    def create(self, validated_data):
        logger.info("Starting category creation.")
        global_user = User.objects.get(username='global')
        user = validated_data.pop('owner', None)

        try:
            # Check if category exists for the global user
            logger.debug(f"Checking if category exists for the global user: {validated_data}")
            existing_category = Category.objects.get(owner=global_user, **validated_data)
            logger.warning(f"Category already exists globally: {existing_category.name}")
            return Response({'detail': 'Category already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        except Category.DoesNotExist:
            try:
                # Check if category exists for the specific user
                logger.debug(f"Checking if category exists for the user {user}: {validated_data}")
                existing_category = Category.objects.get(owner=user, **validated_data)
                logger.warning(f"Category already exists for user {user.username}: {existing_category.name}")
                return Response({'detail': 'Category already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            except Category.DoesNotExist:
                # Create a new category
                logger.info(f"Creating new category for user {user.username}: {validated_data}")
                new_category = Category.objects.create(owner=user, **validated_data)
                logger.info(f"Category created successfully: {new_category.name} (ID: {new_category.id})")
                return new_category
        except Exception as e:
            logger.error(f"Error during category creation: {e}")
            raise e


class ExpenseSerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    categories = CategorySerializer(many=True, read_only=False)

    class Meta:
        model = Expense
        fields = ['url', 'id', 'invoice_date_time', 'price', 'currency', 'note', 'categories', 'invoice_issuer',
                  'invoice_as_text', 'owner']

    def create(self, validated_data):
        logger.info("Starting expense creation.")
        categories_data = validated_data.pop('categories')
        try:
            expense = Expense.objects.create(**validated_data)
            logger.info(f"Expense created with ID: {expense.id}")

            # Set currency from UserSettings
            user_settings = UserSettings.objects.filter(owner=expense.owner).first()
            if user_settings:
                expense.currency = user_settings.currency
                logger.info(f"Currency set to {expense.currency} for user {expense.owner.username}.")
            else:
                logger.warning(f"No UserSettings found for user {expense.owner.username}. Currency not set.")

            expense.save()

            # Handle categories
            global_user = User.objects.get(username='global')
            for category_data in categories_data:
                try:
                    category = Category.objects.get(owner=expense.owner, **category_data)
                except Category.DoesNotExist:
                    category = Category.objects.get(owner=global_user, **category_data)
                expense.categories.add(category)
                logger.info(f"Category '{category.name}' added to expense ID: {expense.id}.")

            return expense
        except Exception as e:
            logger.error(f"Error during expense creation: {e}")
            raise e

    def update(self, instance, validated_data):
        logger.info(f"Starting expense update for ID: {instance.id}")
        categories_data = validated_data.pop('categories', [])

        try:
            # Update expense fields
            instance.invoice_date_time = validated_data.get('invoice_date_time', instance.invoice_date_time)
            instance.price = validated_data.get('price', instance.price)
            instance.note = validated_data.get('note', instance.note)
            instance.invoice_issuer = validated_data.get('invoice_issuer', instance.invoice_issuer)
            instance.invoice_as_text = validated_data.get('invoice_as_text', instance.invoice_as_text)
            instance.currency = validated_data.get('currency', instance.currency)
            instance.save()
            logger.info(f"Expense ID: {instance.id} updated successfully.")

            # Update categories
            instance.categories.clear()
            global_user = User.objects.get(username='global')
            for category_data in categories_data:
                try:
                    category = Category.objects.get(owner=instance.owner, **category_data)
                except Category.DoesNotExist:
                    category = Category.objects.get(owner=global_user, **category_data)
                instance.categories.add(category)
                logger.info(f"Category '{category.name}' added to expense ID: {instance.id}.")

            return instance
        except Exception as e:
            logger.error(f"Error during expense update for ID {instance.id}: {e}")
            raise e


class ExpenseOCRSerializer(serializers.Serializer):
    image = serializers.ImageField()

    def validate(self, data):
        # Can be empty. ImageField will check if the file is an image.
        return data


class UserSettingsSerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = UserSettings
        fields = ['url', 'id', 'currency', 'language', 'owner']

    def create(self, validated_data):
        logger.info("Starting UserSettings creation.")
        try:
            user_settings = UserSettings.objects.create(**validated_data)
            logger.info(f"UserSettings created successfully for user: {user_settings.owner.username}.")
            return user_settings
        except Exception as e:
            logger.error(f"Error during UserSettings creation: {e}")
            raise serializers.ValidationError("Failed to create UserSettings.")

    def update(self, instance, validated_data):
        logger.info(f"Starting UserSettings update for user: {instance.owner.username}.")
        try:
            instance.currency = validated_data.get('currency', instance.currency)
            instance.language = validated_data.get('language', instance.language)
            instance.save()
            logger.info(f"UserSettings updated successfully for user: {instance.owner.username}.")
            return instance
        except Exception as e:
            logger.error(f"Error during UserSettings update for user {instance.owner.username}: {e}")
            raise serializers.ValidationError("Failed to update UserSettings.")