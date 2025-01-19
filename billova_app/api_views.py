import base64
from time import timezone

from django.contrib.auth.models import User
from django.core.serializers import serialize
from django.http import HttpResponseRedirect, HttpResponse
from rest_framework import viewsets, permissions
from rest_framework.decorators import action

from billova_app.models import Expense, Category, UserSettings
from billova_app.ocr.receipt import Receipt
from billova_app.serializers import ExpenseSerializer, CategorySerializer, UserSettingsSerializer, ExpenseOCRSerializer
from billova_app.permissions import IsOwner
from django.utils import timezone
from dateutil import parser


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    This ViewSet automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions.
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        # Limit expenses to those belonging to the logged-in user
        return self.queryset.filter(owner=self.request.user)

    @action(detail=False, methods=['post'], url_path='ocr', serializer_class=ExpenseOCRSerializer)
    def ocr(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            image = serializer.validated_data['image']

            try:
                receipt = Receipt(image.file.getvalue())
                receipt.analyze()

                expense = Expense.objects.create(
                    owner=request.user,
                    invoice_date_time=receipt.invoice_date_time,
                    price=receipt.price,
                    invoice_issuer=receipt.invoice_issuer,
                    invoice_as_text=receipt.invoice_as_text,
                )
            except:
                return HttpResponse("Ooops, something went wrong while processing the receipt.")


            global_user = User.objects.get(username='global')
            category = Category.objects.get_or_create(name="Generated", owner=global_user)[0]
            expense.categories.set([category])

            return HttpResponse(expense)

        return HttpResponse('Invalid input data.')


class CategoryViewSet(viewsets.ModelViewSet):
    """
    This ViewSet automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        global_user = User.objects.get(username='global')
        return Category.objects.filter(owner__in=[self.request.user, global_user])


class UserSettingsViewSet(viewsets.ModelViewSet):
    """
    This ViewSet automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions.
    """
    queryset = UserSettings.objects.all()
    serializer_class = UserSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
