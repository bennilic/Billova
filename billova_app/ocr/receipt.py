import os
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeResult
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest
from azure.core.exceptions import HttpResponseError


class Receipt(object):
    """
        Uses Azure OCR technologies to process receipts based on images taken with a camera.

        Docs:
            https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/receipt?view=doc-intel-4.0.0
            https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/quickstarts/get-started-sdks-rest-api?view=doc-intel-4.0.0&preserve-view=true&pivots=programming-language-python
            https://github.com/Azure-Samples/document-intelligence-code-samples/blob/main/schema/2024-11-30-ga/receipt.md
    """

    def __init__(self, receipt: bytes):
        """
        :param receipt: The receipt image as bytes.
            Supported formats (full): PDF, JPEG/JPG, PNG, BMP, TIFF, HEIF
            Supported formats (partial): DOCX, XLSX, PPTX, HTML
        """
        self.__receipt: bytes = receipt
        self.__endpoint: str = "https://fh-projects-document-intelligence.cognitiveservices.azure.com/"
        self.__key: str = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")

    def analyze(self):
        document_intelligence_client = DocumentIntelligenceClient(
            endpoint=self.__endpoint, credential=AzureKeyCredential(self.__key)
        )

        poller = document_intelligence_client.begin_analyze_document(
            "prebuilt-layout",
            AnalyzeDocumentRequest(bytes_source=self.__receipt)
        )

        receipt = poller.result()
        return receipt
