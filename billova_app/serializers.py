from rest_framework import serializers

from billova_app.models import Expense, UserSettings, Category


class ExpenseSerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    # category = serializers.HyperlinkedRelatedField(view_name='categories', read_only=True)

    class Meta:
        model = Expense
        fields = ['url', 'id', 'invoice_date_time', 'price', 'note', 'invoice_issuer', 'invoice_as_text', 'owner']

    def create(self, validated_data):
        # Attach the owner to the expense during creation
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class CategorySerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Category
        fields = ['url', 'id', 'name', 'owner']


class UserSettingsSerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = UserSettings
        fields = ['url', 'id', 'currency', 'language', 'owner']
