import logging

from babel import Locale

# Set up logging
logger = logging.getLogger(__name__)


def get_all_currencies():
    """
    Retrieves all available currency codes and their names for the specified locale.
    Default locale is set to German ('de').

    Returns:
        dict: A dictionary with currency codes as keys and currency names as values.
    """
    currencies = {}
    try:
        # Initialize Locale with German ('de')
        locale = Locale('de')  # Change locale as needed
        logger.info("Fetching currency data for locale: %s", locale.language)

        # Iterate through currencies in the locale
        for currency_code, currency_name in locale.currencies.items():
            currencies[currency_code] = currency_name
        logger.info("Successfully retrieved %d currencies.", len(currencies))
    except KeyError as e:
        # Handle cases where a specific currency code is invalid
        logger.error("Invalid currency code encountered: %s", e)
    except Exception as e:
        # Catch-all for unexpected exceptions
        logger.exception("An unexpected error occurred while fetching currencies: %s", str(e))
    finally:
        # Log the completion of the function
        logger.debug("Currency retrieval process completed.")

    return currencies
