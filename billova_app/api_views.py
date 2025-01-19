from django.contrib.auth.models import User
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination

from billova_app.models import Expense, Category, UserSettings
from billova_app.ocr.receipt import Receipt
from billova_app.serializers import ExpenseSerializer, CategorySerializer, UserSettingsSerializer, ExpenseOCRSerializer
from billova_app.permissions import IsOwner
from rest_framework.response import Response

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
                return Response({'detail': 'OCR failed'}, status=status.HTTP_400_BAD_REQUEST)


            global_user = User.objects.get(username='global')
            category = Category.objects.get_or_create(name="Generated", owner=global_user)[0]
            expense.categories.set([category])

            expense_serializer = ExpenseSerializer(expense, context={'request': request})
            return Response(expense_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


class MonthlyExpensesViewSet(viewsets.ViewSet):
    """
    A ViewSet for listing monthly expenses grouped by months.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def list(self, request):
        user = request.user

        # Group expenses by month
        expenses = (
            Expense.objects.filter(owner=user)
            .annotate(month=TruncMonth('invoice_date_time'))
            .values('month')
            .annotate(total_spent=Sum('price'))
            .order_by('-month')
        )

        # PageNumberPagination divides the results of a query into "pages"
        # and returns only the data for the requested page. We will use it to limit the results the
        # user gets with one request.
        paginator = PageNumberPagination()
        # Paginate a queryset if needed to return only a part of the results
        paginated_expenses = paginator.paginate_queryset(expenses, request)

        # Include categories for each month
        categories_by_month = {}
        for expense in Expense.objects.filter(owner=user):
            month = expense.invoice_date_time.strftime('%Y-%m')
            if month not in categories_by_month:
                categories_by_month[month] = set()
            categories_by_month[month].update(expense.categories.values_list('name', flat=True))

        response_data = [
            {
                'month': expense['month'].strftime('%B %Y'),
                'total_spent': expense['total_spent'],
                'categories': list(categories_by_month[expense['month'].strftime('%Y-%m')])
            }
            for expense in paginated_expenses
        ]

        return paginator.get_paginated_response(response_data)

