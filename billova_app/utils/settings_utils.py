import logging

from babel import Locale
from babel.numbers import get_currency_name

# Set up logging
logger = logging.getLogger(__name__)


def get_current_currencies(language='en'):
    """
    Retrieves a dictionary of current currencies (ISO 4217) and their localized names,
    excluding obsolete, testing, or unknown currencies.

    Args:
        language (str): The language locale for currency names (e.g., 'en', 'de').

    Returns:
        dict: A dictionary with currency codes as keys and currency names as values.
    """
    logger.info("Fetching current currencies for language: %s", language)
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
                    logger.debug("Added currency: %s (%s)", code, currency_name)
                except KeyError:
                    # Skip invalid or unknown currency codes
                    logger.warning("Skipping unknown or invalid currency code: %s", code)
                    continue
    except Exception as e:
        logger.error("Error while fetching current currencies: %s", e, exc_info=True)

    logger.info("Fetched %d currencies for language: %s", len(current_currencies), language)
    return current_currencies


def get_currency_choices(languages):
    """
    Generates a list of currency choices from the provided languages.
    Each choice is a tuple (currency_code, currency_name).
    """
    logger.info("Generating currency choices for languages: %s", languages)
    currency_codes = ["USD", "EUR", "GBP", "JPY", "TRY", "RON"]  # Add more codes as needed
    choices = []
    for code in currency_codes:
        try:
            currency_name = get_currency_name(code)  # Get the human-readable name
            choices.append((code, currency_name))  # Create the (value, name) tuple
            logger.debug("Added choice: %s for : %s", code, currency_name)
        except Exception as e:
            print(f"Error retrieving currency name for {code}: {e}")
            logger.warning("Error retrieving currency name for %s in language %s", code, e)

    logger.info("Generated %d currency choices.", len(choices))
    return choices
