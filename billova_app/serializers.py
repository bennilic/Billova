from rest_framework import serializers

from billova_app.models import Expense, UserSettings, Category


class CategorySerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Category
        fields = ['url', 'id', 'name', 'owner']


class ExpenseSerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    categories = CategorySerializer(many=True)

    class Meta:
        model = Expense
        fields = ['url', 'id', 'invoice_date_time', 'price', 'note', 'categories', 'invoice_issuer', 'invoice_as_text',
                  'owner']

    def create(self, validated_data):
        categories_data = validated_data.pop('categories')
        expense = Expense.objects.create(**validated_data)
        for category_data in categories_data:
            category = Category.objects.get(owner=expense.owner, **category_data)
            expense.categories.add(category)
        return expense

    def update(self, expense, validated_data):
        categories_data = validated_data.pop('categories')
        expense.invoice_date_time = validated_data.get('invoice_date_time', expense.invoice_date_time)
        expense.price = validated_data.get('price', expense.price)
        expense.note = validated_data.get('note', expense.note)
        expense.invoice_issuer = validated_data.get('invoice_issuer', expense.invoice_issuer)
        expense.invoice_as_text = validated_data.get('invoice_as_text', expense.invoice_as_text)
        expense.save()
        expense.categories.clear()
        for category_data in categories_data:
            category = Category.objects.get(owner=expense.owner, **category_data)
            expense.categories.add(category)
        return expense


class UserSettingsSerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = UserSettings
        fields = ['url', 'id', 'currency', 'language', 'owner']
