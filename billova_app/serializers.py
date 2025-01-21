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
        global_user = User.objects.get(username='global')
        user = validated_data.pop('owner', None)
        try:
            Category.objects.get(owner=global_user, **validated_data)
        except Category.DoesNotExist:
            try:
                Category.objects.get(owner=user, **validated_data)
            except Category.DoesNotExist:
                return Category.objects.create(owner=user, **validated_data)
        return Response({'detail': 'Category already exists.'}, status=status.HTTP_400_BAD_REQUEST)


class ExpenseSerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    categories = serializers.PrimaryKeyRelatedField(many=True, queryset=Category.objects.all())
    CURRENCY_MAP = {
        '€': 'EUR',
        'Euro': 'EUR',
        'EUR': 'EUR',
        '$': 'USD',
        'Dollar': 'USD',
        'USD': 'USD',
        '£': 'GBP',
        'Pound': 'GBP',
        'GBP': 'GBP',
        '¥': 'JPY',
        'Yen': 'JPY',
        'JPY': 'JPY',
        'Lei': 'RON',
        'RON': 'RON',
        # Add more mappings as needed
    }

    class Meta:
        model = Expense
        fields = ['id', 'invoice_date_time', 'price', 'currency', 'note', 'categories', 'invoice_issuer', 'owner']
        read_only_fields = ['owner']

    def validate_currency(self, value):
        normalized_currency = self.CURRENCY_MAP.get(value.strip(), None)
        if not normalized_currency:
            raise serializers.ValidationError(
                f"Invalid currency: {value}. Please use symbols, full names, or ISO codes.")
        return normalized_currency

    def create(self, validated_data):
        categories_data = validated_data.pop('categories', [])
        user = self.context['request'].user

        # Retrieve currency from UserSettings
        user_settings = UserSettings.objects.filter(owner=user).first()
        validated_data['currency'] = user_settings.currency if user_settings else 'EUR'

        expense = Expense.objects.create(owner=user, **validated_data)

        # Assign categories
        for category_data in categories_data:
            category, _ = Category.objects.get_or_create(owner=expense.owner, defaults=category_data)
            expense.categories.add(category)
        return expense

    def update(self, instance, validated_data):
        categories_data = validated_data.pop('categories', [])
        user = self.context['request'].user

        # Update currency if not explicitly provided
        if 'currency' not in validated_data:
            user_settings = UserSettings.objects.filter(owner=user).first()
            if user_settings:
                validated_data['currency'] = user_settings.currency

        # Update fields
        try:
            instance.invoice_date_time = validated_data.get('invoice_date_time', instance.invoice_date_time)
            instance.price = validated_data.get('price', instance.price)
            instance.note = validated_data.get('note', instance.note)
            instance.invoice_issuer = validated_data.get('invoice_issuer', instance.invoice_issuer)
            instance.invoice_as_text = validated_data.get('invoice_as_text', instance.invoice_as_text)
            instance.currency = validated_data.get('currency', instance.currency)
            instance.save()

            # Update categories if provided
            if categories_data:
                instance.categories.clear()
                for category_data in categories_data:
                    category, _ = Category.objects.get_or_create(owner=instance.owner, defaults=category_data)
                    instance.categories.add(category)
            return instance
        except Exception as e:
            logger.error(f"Error updating expense {instance.id}: {e}")
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
