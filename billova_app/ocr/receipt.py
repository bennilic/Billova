import os
from datetime import timezone
from io import BytesIO

import requests

from django.contrib.auth.models import User
from django.utils import timezone


class Receipt:
    """
    Uses Veryfi to extract receipt information.

    Docs:
        https://docs.veryfi.com/api/receipts-invoices/process-a-document/
    """

    def __init__(self, receipt: bytes):
        """
        :param receipt: The receipt image as bytes.
        """
        self.__receipt: bytes = receipt
        self.__client_id = os.getenv("VERYFI_CLIENT_ID")
        self.__username = os.getenv("VERYFI_USERNAME")
        self.__api_key = os.getenv("VERYFI_API_KEY")

        self.invoice_date_time = timezone.now()
        self.price = None
        self.invoice_issuer = None
        self.invoice_as_text = None
        self.categories = [{"name":"Generated", "owner": User.objects.get(username='global')}]

    def analyze(self):
        url = "https://api.veryfi.com/api/v8/partner/documents/"

        # File-like object for the binary receipt data
        file_like = BytesIO(self.__receipt)

        # Files payload
        files = {
            "file": ("receipt.jpg", file_like, "image/jpeg"),  # (filename, file-like object, MIME type)
        }

        # Headers for authentication
        headers = {
            "CLIENT-ID": self.__client_id,
            "AUTHORIZATION": f"apikey {self.__username}:{self.__api_key}",
        }
        # if response.status_code == 201:
        # Send the request
        response = requests.post(url, headers=headers, files=files)

        data = response.json()
        # self.invoice_date_time = data.get("created")
        self.price = data.get("total")
        self.invoice_issuer = data.get("vendor", {}).get("name")
        self.invoice_as_text = data.get("ocr_text")


        return None