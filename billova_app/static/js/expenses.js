import * as Utils from './utils/utils.js';
import {getCsrfTokenFromForm} from './utils/utils.js';
import {ButtonBuilder, ElementBuilder} from "./builder/builder.js";


const LogLevel = {
    DEBUG: 4,
    INFO: 3,
    WARN: 2,
    ERROR: 1,
    OFF: 0,
};

const log_level = LogLevel.ERROR

class Logger {
    constructor(level = log_level, logEndpoint = "/api/v1/logs/") {
        this.level = level;
        this.logEndpoint = logEndpoint;
    }

    sendLog(level, message, extra = {}) {
        const payload = {
            level,
            message,
            extra,
        };

        // Fetch the CSRF token from the meta tag
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        fetch(this.logEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'X-CSRFToken': token,

            },
            body: JSON.stringify(payload),
        }).catch(err => {
            console.error("Failed to send log to server:", err);
        });
    }

    debug(...args) {
        if (this.level >= LogLevel.DEBUG) {
            console.debug("[DEBUG]", ...args);
            this.sendLog("DEBUG", args.join(" "));
        }
    }

    info(...args) {
        if (this.level >= LogLevel.INFO) {
            console.info("[INFO]", ...args);
            this.sendLog("INFO", args.join(" "));
        }
    }

    warn(...args) {
        if (this.level >= LogLevel.WARN) {
            console.warn("[WARN]", ...args);
            this.sendLog("WARNING", args.join(" "));
        }
    }

    error(...args) {
        if (this.level >= LogLevel.ERROR) {
            console.error("[ERROR]", ...args);
            this.sendLog("ERROR", args.join(" "));
        }
    }
}

// Initialize logger with desired level
const logger = new Logger(log_level);

const SELECTORS = {
    expenseTable: '#expensesTable',
    expenseTableBody: '.uiExpensesTblBody',
    saveExpenseButton: '#saveExpenseEntryButton',
    editExpenseButton: '.edit-expense-btn',
    deleteExpenseButton: '.delete-expense-btn',
    confirmDeleteExpenseButton: '.confirm-delete-expense-btn',
    createExpenseModalOpenerBtn: '.create-expenseEntry-btn',
    createExpenseForm: '#expenseEntryForm',
    editExpenseForm: '#editExpenseEntryForm',
    createOCRExpenseForm: '#ocrExpenseEntryForm',
    saveOCRExpenseButton: '#saveOCRExpenseEntryButton',
    createOCRFormFields: {
        ocrFileUpload: '#ocrFileUpload'
    },
    deleteExpenseForm: '#deleteExpenseForm',
    deleteExpenseEntryModal: '#deleteExpenseEntryModal',
    createExpenseModal: '#createExpenseEntryModal',
    editExpenseEntryModal: '#editExpenseEntryModal',
    noExpensesCard: '.no-expenses-card',
    csrfToken: "[name=csrfmiddlewaretoken]",
    createEditFormFields: {
        expenseCategories: '#expenseCategories',
        expenseValue: '#expenseValue',
        expenseCurrency: '#expenseCurrency',
        expenseDate: '#expenseDate',
        expenseIssuer: '#expenseIssuer',
        expenseNote: '#expenseNote',
        updateExpenseButton: '#updateExpenseEntryButton'
    }
};

const DATA = {
    bootstrapFormValidated: 'was-validated', // used by bootstrap to style invalid forms
    vanillaDataTableInstance: undefined,
    allCategoriesList: undefined,
    sessionStorageKey: "expenses"
};

document.addEventListener('DOMContentLoaded', function () {
    setupDomEvents();
    populateExpensesTable();
});


function onCreateExpenseModalShown(formSelector) {
    // no need to recreate the categories list if already done. This happens when the user opened the
    // modal dialog before
    if (!DATA.allCategoriesList) {
        fetchAndUpdateCategoriesList(document.querySelector(formSelector));
    }
}

/**
 * Fetch all the categories of the current user and update
 * the select list containing them.
 * @param form the form in which the select list can be found
 * @param callback a callback to be called after successful REST request, default is undefined
 */
function fetchAndUpdateCategoriesList(form, callback = undefined) {
    if (!form) {
        logger.log("The categories select list cannot be updated for the form " + form);
        return;
    }

    fetch('/api/v1/categories/', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Cache-Control': 'max-age=3600' // Cache for 1 hour
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

            return response.json();
        })

        .then(data => {
            if (!data.results) {
                throw new Error("Error fetching categories");
            }

            populateCategoriesSelectList(data.results, form);
            DATA.allCategoriesList = data.results;

            if (typeof callback === 'function') {
                callback();
            }

        })
        .catch(error => {
            logger.error(error.message);
            Utils.showNotificationMessage(
                'We were unable to load your categories list. Please try again later.',
                "error");
        });
}


function populateCategoriesSelectList(categories, form) {
    if (!categories) {
        throw new Error('No categories provided');
    }

    categories.forEach(function (item, index) {
        addCategoriesToSelectList(item, form);
    });
}

/**
 * Update the select list containing the categories of the current user.
 * @param category category to be added to the select list
 * @param form the form to which the select list belongs
 */
function addCategoriesToSelectList(category, form) {
    if (!category) {
        throw new Error("No category provided");
    }
    if (!category.name) {
        throw new Error("Name of category not found");
    }
    if (!form) {
        throw new Error("Html form was not provided");
    }

    const selectList = form.querySelector(SELECTORS.createEditFormFields.expenseCategories);
    if (!selectList) {
        throw new Error("Categories Select List not found");
    }

    const optionBuilder = new ElementBuilder('option')
        .attr({
            "value": category.name
        })
        .text(category.name);

    selectList.append(optionBuilder.element);
}

function setupDomEvents() {
    logger.debug("Setting up DOM events.");

    const createEntryModal = document.querySelector(SELECTORS.createExpenseModal);
    if (createEntryModal) {
        createEntryModal.addEventListener('shown.bs.modal', (e) => {
            onCreateExpenseModalShown(SELECTORS.createExpenseForm);
        });
    }

    const editEntryModal = document.querySelector(SELECTORS.editExpenseEntryModal);
    if (editEntryModal) {
        editEntryModal.addEventListener('shown.bs.modal', (e) => {
            onEditExpenseModalShown(e, SELECTORS.editExpenseForm);
        });
    }

    const deleteEntryModal = document.querySelector(SELECTORS.deleteExpenseEntryModal);
    if (deleteEntryModal) {
        deleteEntryModal.addEventListener('shown.bs.modal', onDeleteModalShown);
    }

    const saveOCRExpenseButton = document.querySelector(SELECTORS.saveOCRExpenseButton);
    if (saveOCRExpenseButton) {
        saveOCRExpenseButton.addEventListener('click', saveOCRExpense);
    }

    const saveExpenseButton = document.querySelector(SELECTORS.saveExpenseButton);
    if (saveExpenseButton) {
        saveExpenseButton.addEventListener('click', saveExpense);
    }
}

function saveExpense(e) {
    const createExpenseForm = document.querySelector(SELECTORS.createExpenseForm);
    if (!createExpenseForm) {
        logger.error("Create expense form not found.");
        Utils.showNotificationMessage("Error: Unable to find the expense form.", "error");
        return;
    }

    // Validate form inputs
    if (!createExpenseForm.checkValidity()) {
        createExpenseForm.classList.add(DATA.bootstrapFormValidated);
        logger.debug("Form validation failed.");
        return;
    }

    try {
        // Prepare expense data
        const expenseData = {
            categories: getCategoriesArrayFromSelectList(createExpenseForm),
            invoice_date_time: createExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseDate).value,
            price: createExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseValue).value,
            currency: createExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseCurrency).value,
            note: createExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseNote).value,
            invoice_issuer: createExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseIssuer).value,
        };

        // Validate expense data fields
        Object.keys(expenseData).forEach(field => {
            if (!expenseData[field]) {
                logger.warn(`Missing data for field: ${field}`);
            }
        });

        logger.debug("Prepared expense data:", expenseData);

        const csrfToken = getCsrfTokenFromForm(createExpenseForm);

        // Send data to the API
        fetch('/api/v1/expenses/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(expenseData),
        })
            .then(response => {
                if (!response.ok) {
                    logger.error("Failed to create expense. Status:", response.status);
                    throw new Error(`Failed to create expense: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                logger.debug("Expense created successfully:", data);

                Utils.closeModal(SELECTORS.createExpenseModal);
                addExpenseToTable(data);
                addExpenseToSessionStorage(data);
                Utils.toggleElementVisibility(SELECTORS.noExpensesCard, false);

                Utils.showNotificationMessage(
                    `Expense added successfully: ${data.price} ${data.currency}`,
                    "success"
                );
            })
            .catch(async error => {
                logger.error("Error occurred during expense creation:", error);
                let errorMessage = "Unable to create the expense.";

                if (error.response) {
                    try {
                        const errorDetails = await error.response.json();
                        errorMessage += ` Details: ${errorDetails.message || error.response.statusText}`;
                    } catch (e) {
                        logger.error("Failed to parse error response:", e);
                    }
                }
                Utils.showNotificationMessage("Unable to create the expense.", "error");
            });
    } catch (error) {
        logger.error("Unexpected error during saveExpense execution:", error);
        Utils.showNotificationMessage(
            "An unexpected error occurred while creating the expense. Please try again later.",
            "error"
        );
    }
}

function saveOCRExpense(e) {
    logger.debug('Starting OCR Expense creation.');
    const createOCRExpenseForm = document.querySelector(SELECTORS.createOCRExpenseForm);

    if (!createOCRExpenseForm) {
        logger.error('OCR expense form not found.');
        Utils.showNotificationMessage('Error, please try again.', "error");
        return;
    }

    // Validate the form
    if (!createOCRExpenseForm.checkValidity()) {
        createOCRExpenseForm.classList.add(DATA.bootstrapFormValidated);
        logger.warn('OCR expense form validation failed.');
        Utils.showNotificationMessage('Please fill out all required fields correctly.', "error");
        return;
    }

    const ocrFileUploadInput = createOCRExpenseForm.querySelector(SELECTORS.createOCRFormFields.ocrFileUpload);
    if (!ocrFileUploadInput) {
        logger.error('File upload input not found in OCR form.');
        Utils.showNotificationMessage('File upload input is missing.', "error");
        return;
    }

    const ocrFileUpload = ocrFileUploadInput.files[0];
    if (!ocrFileUpload) {
        logger.warn('No file uploaded.');
        Utils.showNotificationMessage('Please upload an image file.', "error");
        return;
    }

    try {
        // Disable the button to prevent multiple submissions
        toggleSaveOCRExpenseButtonState(true);

        // Prepare the form data
        const formData = new FormData();
        formData.append('image', ocrFileUpload);

        logger.debug('Sending OCR expense data to the server.');

        // Send data to the API
        fetch('/api/v1/expenses/ocr/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfTokenFromForm(createOCRExpenseForm)
            },
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    logger.error(`Failed to create OCR expense. Status: ${response.status}`);
                    throw new Error(`Failed to create OCR expense: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                logger.info('OCR Expense created successfully:', data);

                addExpenseToTable(data);
                Utils.toggleElementVisibility(SELECTORS.noExpensesCard, false);
                Utils.showNotificationMessage('Expense added successfully.', "success");

                // Reset the input field
                ocrFileUploadInput.value = '';
            })
            .catch(error => {
                logger.error('Error during OCR expense creation:', error);
                Utils.showNotificationMessage(
                    'Unable to create the OCR expense. Please try again later or create it manually.',
                    "error"
                );

                // Show the manual expense creation modal as a fallback
                Utils.showBootstrapModal(SELECTORS.createExpenseModal);
            })
            .finally(() => {
                // Re-enable the submit button
                toggleSaveOCRExpenseButtonState(false);
            });

    } catch (error) {
        logger.error('Unexpected error during OCR expense creation:', error);
        Utils.showNotificationMessage(
            'An unexpected error occurred while processing the expense. Please try again later.',
            "error"
        );

        // Re-enable the button to allow retry
        toggleSaveOCRExpenseButtonState(false);
    }
}

function toggleSaveOCRExpenseButtonState(disable = false) {
    const button = document.querySelector(SELECTORS.saveOCRExpenseButton);
    if (button) {
        button.disabled = disable;
    }
}

function onDeleteModalShown(e) {
    const triggerButton = e.relatedTarget;
    const confirmDeleteExpenseButton = e.currentTarget.querySelector(SELECTORS.confirmDeleteExpenseButton);
    if (!confirmDeleteExpenseButton || !triggerButton) {
        return;
    }

    // the id of the expense is set as data attribute on the confirm button. When the button is clicked,
    // we will then use the value in the data attribute for the REST Delete method
    confirmDeleteExpenseButton.dataset.expenseId = triggerButton.dataset.expenseId;
    confirmDeleteExpenseButton.addEventListener('click', deleteExpense);
}

function onEditExpenseModalShown(e, formSelector) {
    const editForm = document.querySelector(formSelector);
    if (!editForm) {
        logger.warn("The given edit form was not found " + formSelector);
        return;
    }

    const triggerButton = e.relatedTarget;
    const editedExpenseId = parseInt(triggerButton.dataset.expenseId);
    const expenses = getExpensesFromSessionStorage();
    const errorMessage = "We cannot access the necessary information for your expense";

    if (!expenses) {
        Utils.showNotificationMessage(errorMessage, "error");
        return;
    }

    const editedExpense = getExpenseById(editedExpenseId, expenses);
    if (!editedExpense) {
        Utils.showNotificationMessage(errorMessage, "error");
        return;
    }

    // the callback will be called in case the edit modal is opening for the first time.
    // The reason is that the categories are fetched async using REST, and they are rendered in
    // the promise, which means, at the moment when the modal opens, we do not have the categories rendered.
    // In edit mode, we want to prefill the inputs, and therefore, we need a callback after the categories
    // were already rendered.
    const prefillCallback = () => {
        prefillInputFieldsOnEditAction(editedExpense, editForm);
    };

    if (!DATA.allCategoriesList) {
        fetchAndUpdateCategoriesList(editForm, prefillCallback);
    } else {
        prefillInputFieldsOnEditAction(editedExpense, editForm);
    }

    const editModal = editForm.closest(SELECTORS.editExpenseEntryModal);
    if (editModal) {
        editModal.querySelector(SELECTORS.createEditFormFields.updateExpenseButton)
            .addEventListener("click", (e) => {
                updateExpense(editedExpenseId, editForm);
            });
    }
}

function prefillInputFieldsOnEditAction(editedExpense, editForm) {
    if (!editedExpense) {
        logger.error("Edited expense is missing.");
        return;
    }
    if (!editForm) {
        logger.error("Edit form is missing.");
        return;
    }

    editForm.querySelector(SELECTORS.createEditFormFields.expenseDate).value = editedExpense.invoice_date_time || '';
    editForm.querySelector(SELECTORS.createEditFormFields.expenseValue).value = editedExpense.price || '';
    editForm.querySelector(SELECTORS.createEditFormFields.expenseIssuer).value = editedExpense.invoice_issuer || '';

    const formattedDate = editedExpense.invoice_date_time
        ? new Date(editedExpense.invoice_date_time).toISOString().split('T')[0]
        : '';
    editForm.querySelector(SELECTORS.createEditFormFields.expenseDate).value = formattedDate || '';

    editForm.querySelector(SELECTORS.createEditFormFields.expenseNote).value = editedExpense.note || '';

    // Populate the categories in the select field
    const categorySelect = editForm.querySelector(SELECTORS.createEditFormFields.expenseCategories);
    if (categorySelect) {
        // Clear existing selections
        Array.from(categorySelect.options).forEach(option => {
            option.selected = false;
        });

        // Select the relevant categories
        if (editedExpense.categories && editedExpense.categories.length > 0) {
            editedExpense.categories.forEach(category => {
                const matchingOption = Array.from(categorySelect.options).find(option => option.value === category.name);
                if (matchingOption) {
                    matchingOption.selected = true;
                }
            });
        }
    }
}

function deleteExpense(e) {
    const toDeleteExpenseId = e.currentTarget.dataset.expenseId;
    const errorMessage = 'An error occurred while trying to delete the expense. Please try again later.';

    if (!toDeleteExpenseId || isNaN(parseInt(toDeleteExpenseId))) {
        Utils.showNotificationMessage(errorMessage, "error");
        return;
    }

    const deleteForm = document.querySelector(SELECTORS.deleteExpenseForm);
    if (!deleteForm) {
        Utils.showNotificationMessage(errorMessage, "error");
        return;
    }

    fetch(`/api/v1/expenses/${toDeleteExpenseId}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': Utils.getCsrfTokenFromForm(deleteForm)
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to delete expense: ${response.statusText}`);
            }

            Utils.closeModal(SELECTORS.deleteExpenseEntryModal);
            Utils.showNotificationMessage('Expense deleted successfully', "success");

            setTimeout(function () {
                // we need to reload the page after delete. Reason is that the library is buggy, when
                // there is some filter applied, and we try to use the library to remove the selected row, then
                // an error is thrown
                location.reload();
            }, 1000);

        })
        .catch(error => {
            logger.error(error);
            Utils.showNotificationMessage(errorMessage, "error");
        });
}

function populateExpensesTable() {
    fetchAllExpenses()
        .then(expenses => {
            reinitializeVanillaDataTable();
            addExpensesListToTable(expenses); // Pass all fetched expenses
            saveExpensesInSessionStorage(expenses);
        })
        .catch(error => {
            logger.error(error.message);
            Utils.showNotificationMessage(
                'We were unable to load your expense list. Please try again later.',
                "error");
        });
}

/**
 * Fetch all expenses asynchronous.
 * We are using django pagination, this means we always get 10 results for each request.
 * In the expense table, we want to load all the data at once and initialize the table
 * with the received data.
 */
async function fetchAllExpenses(url = '/api/v1/expenses/') {
    const expenses = [];

    // Iterate over all the available result pages and create a new request for each of them
    while (url) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        if (!response.ok) {
            Utils.toggleElementVisibility(SELECTORS.noExpensesCard, true);
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();
        expenses.push(...data.results); // Add current page results
        url = data.next; // Get the next page URL
    }

    return expenses;
}

function updateExpense(expenseId, editExpenseForm) {
    if (!editExpenseForm) {
        return;
    }
    if (!editExpenseForm.checkValidity()) {
        editExpenseForm.classList.add(DATA.bootstrapFormValidated);
        return;
    }

    // JSON sent to the API
    const expenseData = {
        categories: getCategoriesArrayFromSelectList(editExpenseForm),
        invoice_date_time: editExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseDate).value,
        price: editExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseValue).value,
        currency: editExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseCurrency).value,
        note: editExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseNote).value,
        invoice_issuer: editExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseIssuer).value
    };

    fetch(`/api/v1/expenses/${expenseId}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': Utils.getCsrfTokenFromForm(editExpenseForm)
        },
        body: JSON.stringify(expenseData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to update expense: ${response.statusText}`);
            }

            return response.json();
        })
        .then(data => {

            Utils.closeModal(SELECTORS.editExpenseEntryModal);
            Utils.showNotificationMessage('Expense updated successfully', "success");

            setTimeout(function () {
                location.reload();
            }, 1000);

        })
        .catch(error => {
            logger.error('Error creating expense:', error);
            Utils.showNotificationMessage(
                'Unable to update the expense. Please ensure all fields are filled out correctly.',
                "error");
        });
}

function addExpensesListToTable(expenses) {
    try {
        logger.debug("Initializing the addition of expenses to the table.");

        const expensesTable = document.querySelector(SELECTORS.expenseTable);
        if (!expensesTable) {
            logger.error("Expenses table not found.");
            Utils.toggleElementVisibility(SELECTORS.noExpensesCard, true);
            Utils.showNotificationMessage("Error loading the table.", "error");
            throw new Error("No expenses table found.");
        }

        if (!expenses || !Array.isArray(expenses)) {
            logger.warn("No valid expenses list provided.");
            Utils.toggleElementVisibility(SELECTORS.noExpensesCard, true);
            throw new Error("List of expenses is not provided or invalid.");
        }

        if (!expenses.length) {
            logger.warn("No expenses to display.");
            Utils.toggleElementVisibility(SELECTORS.noExpensesCard, true);
            return;
        }

        logger.debug(`Adding ${expenses.length} expenses to the table.`);
        expenses.forEach(expense => {
            try {
                addExpenseToTable(expense);
            } catch (expenseError) {
                logger.error(`Error adding expense with ID: ${expense.id}`, expenseError);
            }
        });

        logger.debug("All expenses have been added to the table successfully.");

    } catch (error) {
        logger.error("Error in addExpensesListToTable:", error);
        Utils.showNotificationMessage(
            "An unexpected error occurred while displaying expenses. Please try again later.",
            "error"
        );
    }
}

function addExpenseToTable(expense, table = document.querySelector(SELECTORS.expenseTable)) {
    const tableBody = table.querySelector(SELECTORS.expenseTableBody);
    if (!tableBody) {
        throw new Error('Table body not found');
    }

    // Prepare the data to be inserted into the DataTable
    let categories = '';
    if (expense.categories && expense.categories.length) {
        categories = expense.categories.map(category => category.name).join(', ');
    }

    const editButton = new ButtonBuilder()
        .class('btn btn-sm btn-secondary me-2 edit-expense-btn')
        .with('data-bs-toggle', 'modal')
        .with('data-bs-target', `${SELECTORS.editExpenseEntryModal}`)
        .with('data-expense-id', expense.id)
        .text('Edit');

    const deleteButton = new ButtonBuilder()
        .class('btn btn-sm btn-danger delete-expense-btn')
        .with('data-bs-toggle', 'modal')
        .with('data-bs-target', `${SELECTORS.deleteExpenseEntryModal}`)
        .with('data-expense-id', expense.id)
        .text('Delete');

    const actionsContainer = new ElementBuilder('div')
        .class('d-flex')
        .append(editButton)
        .append(deleteButton);

    const newData = [{
        "Date": Utils.stringToFormattedDate(expense.invoice_date_time),
        "Spent": expense.price,
        "Currency": expense.currency,
        "Note": expense.note,
        "Issuer": expense.invoice_issuer,
        "Category": categories,
        "Actions": actionsContainer.build().outerHTML
    }];

    if (DATA.vanillaDataTableInstance) {
        DATA.vanillaDataTableInstance.insert(newData);
    }
}

function reinitializeVanillaDataTable() {
    const tableElement = document.querySelector(SELECTORS.expenseTable);
    if (!tableElement) {
        logger.error('Expense table element not found.');
        return;
    }

    if (DATA.vanillaDataTableInstance) {
        DATA.vanillaDataTableInstance.refresh();
    } else {
        DATA.vanillaDataTableInstance = Utils.initializeVanillaDataTable(SELECTORS.expenseTable);
        if (!DATA.vanillaDataTableInstance) {
            logger.error('Failed to initialize Vanilla DataTable.');
        }
    }
}

/**
 * Store expenses in session storage.
 * When the user edits an expense, we will access the data stored in session storage
 * to be able to prefill the input fields.
 */
function saveExpensesInSessionStorage(expenses) {
    if (!window.sessionStorage) {
        return logger.warn("Session storage not supported in your browser.");
    }
    window.sessionStorage.setItem(DATA.sessionStorageKey, JSON.stringify(expenses));
}

/**
 * Update the existing object in session storage or create a new one if it does not exist.
 */
function addExpenseToSessionStorage(expense) {
    if (!window.sessionStorage) {
        return logger.warn("Session storage not supported in your browser.");
    }

    let currentExpenses = window.sessionStorage.getItem(DATA.sessionStorageKey);

    if (!currentExpenses) {
        currentExpenses = [];
    } else {
        currentExpenses = JSON.parse(currentExpenses);
    }

    currentExpenses.push(expense);

    window.sessionStorage.setItem(DATA.sessionStorageKey, JSON.stringify(currentExpenses));
}

function getExpensesFromSessionStorage() {
    const storedExpenses = window.sessionStorage.getItem(DATA.sessionStorageKey);

    if (!storedExpenses) {
        return [];
    }

    return JSON.parse(storedExpenses);
}

function getExpenseById(expenseId, expenses) {
    const expense = expenses.find(exp => exp.id === expenseId);

    return expense || null;
}

function getCategoriesArrayFromSelectList(form) {
    const selectedCategoriesOptions
        = form.querySelector(SELECTORS.createEditFormFields.expenseCategories).selectedOptions;

    return Array.from(selectedCategoriesOptions).map(({value}) => ({
        name: value
    }));
}