from django.contrib.auth.models import User
from rest_framework import serializers, status
from rest_framework.response import Response

from billova_app.models import Expense, UserSettings, Category


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
    categories = CategorySerializer(many=True, read_only=False)

    class Meta:
        model = Expense
        fields = [
            'url', 'id', 'invoice_date_time', 'price', 'currency', 'note',
            'categories', 'invoice_issuer', 'invoice_as_text', 'owner'
        ]
        read_only_fields = ['owner']  # Ensure 'owner' is not required in the payload

    def create(self, validated_data):
        categories_data = validated_data.pop('categories', [])
        request = self.context.get('request')  # Access the request to get the current user
        user = request.user if request else None

        # Retrieve the currency from the UserSettings model
        if user:
            user_settings = UserSettings.objects.filter(owner=user).first()
            validated_data['currency'] = user_settings.currency if user_settings else 'EUR'

        expense = Expense.objects.create(**validated_data)

        # Handle categories
        global_user = User.objects.get(username='global')
        for category_data in categories_data:
            try:
                category = Category.objects.get(owner=expense.owner, **category_data)
            except Category.DoesNotExist:
                category = Category.objects.get(owner=global_user, **category_data)
            expense.categories.add(category)
        return expense

    def update(self, instance, validated_data):
        categories_data = validated_data.pop('categories', [])
        request = self.context.get('request')  # Access the request to get the current user
        user = request.user if request else None

        # Update the currency from the UserSettings model if not explicitly provided
        if 'currency' not in validated_data and user:
            user_settings = UserSettings.objects.filter(owner=user).first()
            if user_settings:
                validated_data['currency'] = user_settings.currency

        # Update other fields
        instance.invoice_date_time = validated_data.get('invoice_date_time', instance.invoice_date_time)
        instance.price = validated_data.get('price', instance.price)
        instance.note = validated_data.get('note', instance.note)
        instance.invoice_issuer = validated_data.get('invoice_issuer', instance.invoice_issuer)
        instance.invoice_as_text = validated_data.get('invoice_as_text', instance.invoice_as_text)
        instance.currency = validated_data.get('currency', instance.currency)
        instance.save()

        # Handle categories
        instance.categories.clear()
        global_user = User.objects.get(username='global')
        for category_data in categories_data:
            try:
                category = Category.objects.get(owner=instance.owner, **category_data)
            except Category.DoesNotExist:
                category = Category.objects.get(owner=global_user, **category_data)
            instance.categories.add(category)
        return instance


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
