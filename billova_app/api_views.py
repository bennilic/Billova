from django.contrib.auth.models import User
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, permissions
from rest_framework.pagination import PageNumberPagination

from billova_app.models import Expense, Category, UserSettings
from billova_app.serializers import ExpenseSerializer, CategorySerializer, UserSettingsSerializer
from billova_app.permissions import IsOwner


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


class MonthlyExpensesPagination(PageNumberPagination):
    page_size = 10  # Default page size
    page_size_query_param = 'page_size'  # Allow clients to customize page size
    max_page_size = 50  # Limit maximum number of results per page


class MonthlyExpensesViewSet(viewsets.ViewSet):
    """
    A ViewSet for listing monthly expenses grouped by months.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    pagination_class = MonthlyExpensesPagination

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
        paginator = self.pagination_class()
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

