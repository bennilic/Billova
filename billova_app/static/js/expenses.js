import * as Utils from './utils/utils.js';
import {ElementBuilder, ButtonBuilder} from "./builder/builder.js";


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

function fetchAndUpdateCategoriesList(form) {
    if (!form) {
        console.log("The categories select list cannot be updated for the form " + form);
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

        })
        .catch(error => {
            console.error(error.message);
            Utils.showNotificationMessage('We were unable to load your categories list. Please try again later.', "error");
        });
}

function populateCategoriesSelectList(categories, form) {
    if (!categories) {
        throw new Error('No categories provided');
    }

    categories.forEach(function(item, index) {
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
        return;
    }
    // make sure the required fields are fulfilled
    if (!createExpenseForm.checkValidity()) {
        createExpenseForm.classList.add(DATA.bootstrapFormValidated);
        return;
    }

    // JSON sent to the API
    const expenseData = {
        categories: getCategoriesArrayFromSelectList(createExpenseForm),
        invoice_date_time: createExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseDate).value,
        price: createExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseValue).value,
        note: createExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseNote).value,
        invoice_issuer: createExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseIssuer).value
    };

    fetch('/api/v1/expenses/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfTokenFromForm(createExpenseForm)
        },
        body: JSON.stringify(expenseData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create expense ' + response.statusText);
            }

            return response.json();
        })
        .then(data => {

            Utils.closeModal(SELECTORS.createExpenseModal);

            addExpenseToTable(data);
            addExpenseToSessionStorage(data);

            Utils.toggleElementVisibility(SELECTORS.noExpensesCard, false);

            Utils.showNotificationMessage('Expense added successfully', "success");

        })
        .catch(error => {
            console.error('Error creating expense:', error);
            Utils.showNotificationMessage('Unable to create the expense. Please ensure all fields are filled out correctly.', "error");
        });
}

function saveOCRExpense(e) {
    console.log('OCR Expense');
    const createOCRExpenseForm = document.querySelector(SELECTORS.createOCRExpenseForm);
    // make sure the required fields are fulfilled
    if (!createOCRExpenseForm || !createOCRExpenseForm.checkValidity()) {
        createOCRExpenseForm.classList.add(DATA.bootstrapFormValidated);
        return;
    }

    const ocrFileUploadInput = createOCRExpenseForm.querySelector(SELECTORS.createOCRFormFields.ocrFileUpload);
    if (!ocrFileUploadInput) {
        console.log('File upload input not found');
        return;
    }

    const ocrFileUpload = ocrFileUploadInput.files[0];
    if (!ocrFileUpload) {
        Utils.showNotificationMessage('Please upload an image file.', "error");
        return;
    }

    // disable the button to not allow the user to upload the same file again
    // while the current one is still being processed
    toggleSaveOCRExpenseButtonState(true);

    // JSON sent to the API
    const formData = new FormData();
    formData.append('image', ocrFileUpload);

    fetch('/api/v1/expenses/ocr/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCsrfTokenFromForm(createOCRExpenseForm)
        },
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create expense ' + response.statusText);
            }

            return response.json();
        })
        .then(data => {

            addExpenseToTable(data);
            Utils.toggleElementVisibility(SELECTORS.noExpensesCard, false);
            Utils.showNotificationMessage('Expense added successfully', "success");

            // re-enable the submit button
            toggleSaveOCRExpenseButtonState(false);

            // reset the input field
            ocrFileUploadInput.value = '';

        })
        .catch(error => {
            console.error('Error creating expense:', error);

            // re-enable the submit button
            toggleSaveOCRExpenseButtonState(false);
            Utils.showNotificationMessage('Unable to create the expense. You can create the expense manually.', "error");

            // show the modal for manual creation
            Utils.showBootstrapModal(SELECTORS.createExpenseModal);
        });
}

function toggleSaveOCRExpenseButtonState(disable=false) {
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
        console.log("The given edit form was not found " + editForm);
        return;
    }

    if (!DATA.allCategoriesList) {
        fetchAndUpdateCategoriesList(editForm);
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

    prefillInputFieldsOnEditAction(editedExpense, editForm);

    const editModal = editForm.closest(SELECTORS.editExpenseEntryModal);
    if (editModal) {
        editModal.querySelector(SELECTORS.createEditFormFields.updateExpenseButton).addEventListener("click", (e) => {
            updateExpense(editedExpenseId, editForm);
        });
    }
}

function prefillInputFieldsOnEditAction(editedExpense, editForm) {
    if (!editedExpense) {
        console.error("Edited expense is missing.");
        return;
    }
    if (!editForm) {
        console.error("Edit form is missing.");
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
            'X-CSRFToken': getCsrfTokenFromForm(deleteForm)
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
            console.error(error);
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
            console.error(error.message);
            Utils.showNotificationMessage('We were unable to load your expense list. Please try again later.', "error");
        });
}

async function fetchAllExpenses(url = '/api/v1/expenses/') {
    // We are using django pagination, this means we always get 10 results for each request.
    // In the expense table we want to load all the data at once and initialize the table.
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
        note: editExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseNote).value,
        invoice_issuer: editExpenseForm.querySelector(SELECTORS.createEditFormFields.expenseIssuer).value
    };

    fetch(`/api/v1/expenses/${expenseId}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfTokenFromForm(editExpenseForm)
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
            console.error('Error creating expense:', error);
            Utils.showNotificationMessage('Unable to update the expense. Please ensure all fields are filled out correctly.', "error");
        });
}

function addExpensesListToTable(expenses) {
    const expensesTable = document.querySelector(SELECTORS.expenseTable);
    if (!expensesTable) {
        Utils.toggleElementVisibility(SELECTORS.noExpensesCard, true);
        throw new Error("No expenses table found");
    }

    if (!expenses) {
        Utils.toggleElementVisibility(SELECTORS.noExpensesCard, true);
        throw new Error("List with expenses not provided");
    }

    if (!expenses.length) {
        Utils.toggleElementVisibility(SELECTORS.noExpensesCard, true);
        return;
    }

    expenses.forEach(expense => {
        addExpenseToTable(expense);
    });
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
        "Note": expense.note,
        "Issuer": expense.invoice_issuer,
        "Category": categories,
        "Actions": actionsContainer.build().outerHTML
    }];

    // Use the DataTable's insert method to add the data
    if (DATA.vanillaDataTableInstance) {
        DATA.vanillaDataTableInstance.insert(newData);
    }
}

function getCsrfTokenFromForm(form) {
    if (!form) {
        return '';
    }

    let token = form.querySelector(SELECTORS.csrfToken);
    if (token) {
        return token.value;
    }

    return '';
}

function reinitializeVanillaDataTable() {
    if (DATA.vanillaDataTableInstance) {
        DATA.vanillaDataTableInstance.refresh();
    } else {
        DATA.vanillaDataTableInstance = Utils.initializeVanillaDataTable(SELECTORS.expenseTable);
    }
}

/**
 * Store expenses in session storage.
 * When the user edits an expense, we will access the data stored in session storage
 * to be able to prefill the input fields.
 */
function saveExpensesInSessionStorage(expenses) {
    if (!window.sessionStorage) {
        return console.log("Session storage not supported in your browser.");
    }
    window.sessionStorage.setItem(DATA.sessionStorageKey, JSON.stringify(expenses));
}

/**
 * Update the existing object in session storage or create a new one if it does not exist.
 */
function addExpenseToSessionStorage(expense) {
    if (!window.sessionStorage) {
        return console.log("Session storage not supported in your browser.");
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

    return Array.from(selectedCategoriesOptions).map(({ value }) => ({
        name: value
    }));
}