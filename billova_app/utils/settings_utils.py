import logging

from babel import Locale
from babel.numbers import get_currency_name, get_currency_symbol

# Set up logging
logger = logging.getLogger(__name__)


def get_current_currencies(language='en'):
    """
    Retrieves a dictionary of current currencies (ISO 4217) and their localized names,
    excluding obsolete, testing, or unknown currencies.

    Returns:
        dict: A dictionary with currency codes as keys and currency names as values.
    """
    current_currencies = {}
    try:
        # A list of ISO 4217 standard exceptions or invalid currency codes to exclude
        excluded_codes = {"XTS", "XXX", "XUA", "XRE"}  # Testing, Unknown, Unit of Account, etc.

        # Iterate over all currency codes provided by Babel
        for code in Locale(language).currencies:
            if code not in excluded_codes:
                try:
                    # Only add valid and non-excluded currency codes
                    currency_name = get_currency_name(code, locale=language)
                    current_currencies[code] = currency_name
                except KeyError:
                    # Skip invalid or unknown currency codes
                    continue
    except Exception as e:
        logger.exception("Error while fetching current currencies: %s", e)

    return current_currencies


def get_currency_choices(languages):
    CURRENCY_CHOICES = []
    for code, language in languages:
        try:
            locale = Locale(code)  # Create the locale
            default_currency = locale.currency  # Get default currency for the locale
            currency_name = get_currency_name(default_currency, locale=code)  # Get currency name
            currency_symbol = get_currency_symbol(default_currency, locale=code)  # Get currency symbol
            CURRENCY_CHOICES.append((language, default_currency, currency_name, currency_symbol))
        except Exception as e:
            print(f"Could not retrieve currency for language {language}: {e}")
    return CURRENCY_CHOICES
