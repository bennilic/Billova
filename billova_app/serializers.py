from rest_framework import serializers

from billova_app.models import Expense, UserSettings, Category


class ExpenseSerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    category = serializers.HyperlinkedRelatedField(view_name='categories', read_only=True)

    class Meta:
        model = Expense
        fields = ['url', 'id', 'invoice_date_time', 'price', 'note', 'invoice_issuer', 'invoice_as_text', 'category', 'owner']


class CategorySerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    user_setting = serializers.HyperlinkedRelatedField(view_name='user_settings', read_only=True)

    class Meta:
        model = Category
        fields = ['url', 'id', 'name', 'user_setting', 'owner']


class UserSettingsSerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    # TODO add HyperlinkedRelatedField for categories here instead of the categories serializer?

    class Meta:
        model = UserSettings
        fields = ['url', 'id', 'currency', 'language', 'owner']
