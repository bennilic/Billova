import logging

from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from billova_app.models import Expense, Category, UserSettings
from billova_app.ocr.receipt import Receipt
from billova_app.permissions import IsOwner
from billova_app.serializers import ExpenseSerializer, CategorySerializer, UserSettingsSerializer, ExpenseOCRSerializer

# Set up the logger
logger = logging.getLogger(__name__)


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    This ViewSet automatically provides `list`, `create`, `retrieve`, `update`, and `destroy` actions.
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def perform_create(self, serializer):
        try:
            with transaction.atomic():  # Ensure database consistency
                expense = serializer.save(owner=self.request.user)
                logger.info(f"Expense created successfully: {expense}")
        except Exception as e:
            logger.error(f"Failed to create expense: {e}")
            raise e

    def get_queryset(self):
        try:
            queryset = self.queryset.filter(owner=self.request.user)
            logger.info(f"Retrieved {queryset.count()} expenses for user {self.request.user}")
            return queryset
        except Exception as e:
            logger.error(f"Failed to retrieve expenses for user {self.request.user}: {e}")
            raise e

    @action(detail=False, methods=['post'], url_path='ocr', serializer_class=ExpenseOCRSerializer)
    def ocr(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                logger.info("Starting OCR processing")
                image = serializer.validated_data['image']
                receipt = Receipt(image.file.read())
                receipt.analyze()

                with transaction.atomic():
                    expense = Expense.objects.create(
                        owner=request.user,
                        invoice_date_time=receipt.invoice_date_time,
                        price=receipt.price,
                        invoice_issuer=receipt.invoice_issuer,
                        invoice_as_text=receipt.invoice_as_text,
                    )
                    global_user = User.objects.get(username='global')
                    category, created = Category.objects.get_or_create(name="Generated", owner=global_user)
                    expense.categories.set([category])

                logger.info(f"OCR processed successfully. Expense created: {expense}")
                expense_serializer = ExpenseSerializer(expense, context={'request': request})
                return Response(expense_serializer.data, status=status.HTTP_201_CREATED)

            except ObjectDoesNotExist as e:
                logger.error(f"User or Category object does not exist: {e}")
                return Response({'detail': 'Required object does not exist'}, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                logger.error(f"OCR processing failed: {e}")
                return Response({'detail': 'OCR processing failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logger.warning(f"Invalid OCR data: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    This ViewSet automatically provides `list`, `create`, `retrieve`, `update`, and `destroy` actions.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def perform_create(self, serializer):
        try:
            category = serializer.save(owner=self.request.user)
            logger.info(f"Category created successfully: {category}")
        except Exception as e:
            logger.error(f"Failed to create category: {e}")
            raise e

    def get_queryset(self):
        try:
            global_user = User.objects.get(username='global')
            queryset = Category.objects.filter(owner__in=[self.request.user, global_user])
            logger.info(f"Retrieved {queryset.count()} categories for user {self.request.user}")
            return queryset
        except Exception as e:
            logger.error(f"Failed to retrieve categories for user {self.request.user}: {e}")
            raise e


class UserSettingsViewSet(viewsets.ModelViewSet):
    """
    This ViewSet automatically provides `list`, `create`, `retrieve`, `update`, and `destroy` actions.
    """
    queryset = UserSettings.objects.all()
    serializer_class = UserSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def perform_create(self, serializer):
        try:
            user_settings = serializer.save(owner=self.request.user)
            logger.info(f"User settings created successfully: {user_settings}")
        except Exception as e:
            logger.error(f"Failed to create user settings: {e}")
            raise e


class MonthlyExpensesViewSet(viewsets.ViewSet):
    """
    A ViewSet for listing monthly expenses grouped by months.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def list(self, request):
        user = request.user
        try:
            logger.info(f"Fetching monthly expenses for user {user}")
            expenses = (
                Expense.objects.filter(owner=user)
                .annotate(month=TruncMonth('invoice_date_time'))
                .values('month')
                .annotate(total_spent=Sum('price'))
                .order_by('-month')
            )

            paginator = PageNumberPagination()
            paginated_expenses = paginator.paginate_queryset(expenses, request)

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
                    'categories': list(categories_by_month[expense['month'].strftime('%Y-%m')]),
                }
                for expense in paginated_expenses
            ]

            logger.info(f"Successfully fetched monthly expenses for user {user}")
            return paginator.get_paginated_response(response_data)

        except Exception as e:
            logger.error(f"Failed to fetch monthly expenses for user {user}: {e}")
            return Response({'detail': 'Failed to fetch monthly expenses'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FrontendLogView(APIView):
    """
    API view to handle logs sent from the frontend.
    """

    def post(self, request, *args, **kwargs):
        """
        Handle POST requests to log frontend messages.
        """
        try:
            data = request.data  # Automatically parses JSON in DRF
            level = data.get("level", "INFO").upper()
            message = data.get("message", "No message provided")
            extra = data.get("extra", {})

            # Log the message at the appropriate level
            if level == "DEBUG":
                logger.debug(message, extra=extra)
            elif level == "INFO":
                logger.info(message, extra=extra)
            elif level == "WARNING":
                logger.warning(message, extra=extra)
            elif level == "ERROR":
                logger.error(message, extra=extra)
            elif level == "CRITICAL":
                logger.critical(message, extra=extra)
            else:
                logger.info(message, extra=extra)

            return Response({"status": "success"}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Failed to log frontend message: {e}")
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
