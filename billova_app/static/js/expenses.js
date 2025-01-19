import * as Utils from './utils/utils.js';
import {ElementBuilder} from "./builder/builder.js";


const SELECTORS = {
    expenseTable: '#expensesTable',
    expenseTableBody: '.uiExpensesTblBody',
    saveExpenseButton: '#saveExpenseEntryButton',
    deleteExpenseButton: '.delete-expense-btn',
    confirmDeleteExpenseButton: '.confirm-delete-expense-btn',
    createExpenseModalOpenerBtn: '.create-expenseEntry-btn',
    createExpenseForm: '#expenseEntryForm',
    deleteExpenseForm: '#deleteExpenseForm',
    deleteExpenseEntryModal: '#deleteExpenseEntryModal',
    createExpenseModal: '#createExpenseEntryModal',
    noExpensesCard: '.no-expenses-card',
    csrfToken: "[name=csrfmiddlewaretoken]",
    createFormFields: {
        expenseCategories: '#expenseCategories',
        expenseValue: '#expenseValue',
        expenseDate: '#expenseDate',
        expenseIssuer: '#expenseIssuer',
        expenseNote: '#expenseNote'
    }
};

const DATA = {
    bootstrapFormValidated: 'was-validated', // used by bootstrap to style invalid forms
    vanillaDataTableInstance: undefined,
    categoriesListCreated: false
};

document.addEventListener('DOMContentLoaded', function () {
    const modalOpenerBtn = document.querySelector(SELECTORS.createExpenseModalOpenerBtn);
    if (modalOpenerBtn) {
        modalOpenerBtn.addEventListener('click', onModalCreateModalBtnOpenerClick);
    }

    const deleteEntryModal = document.querySelector(SELECTORS.deleteExpenseEntryModal);
    if (deleteEntryModal) {
        deleteEntryModal.addEventListener('shown.bs.modal', onDeleteModalShown);
    }

    populateExpensesTable();
});

function onModalCreateModalBtnOpenerClick() {
    // guard - no need to recreate the categories list if already done. This happens when the user opened the
    // modal dialog before
    if (DATA.categoriesListCreated) {
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

            populateCategoriesSelectList(data.results);

            DATA.categoriesListCreated = true;

        })
        .catch(error => {
            console.error(error.message);
            Utils.showNotificationMessage('We were unable to load your categories list. Please try again later.', "error");
        });
}

function populateCategoriesSelectList(categories) {
    if (!categories) {
        throw new Error('No categories provided');
    }

    categories.forEach(function(item, index) {
        addCategoriesToSelectList(item);
    });
}

function addCategoriesToSelectList(category) {
    if (!category) {
        throw new Error("No category provided");
    }
    if (!category.name) {
        throw new Error("Name of category not found");
    }

    const selectList = document.querySelector(SELECTORS.createFormFields.expenseCategories);
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
    const saveExpenseButton = document.querySelector(SELECTORS.saveExpenseButton);
    if (saveExpenseButton) {
        saveExpenseButton.addEventListener('click', saveExpense);
    }
}

function saveExpense(e) {
    const createExpenseForm = document.querySelector(SELECTORS.createExpenseForm);
    // make sure the required fields are fulfilled
    if (!createExpenseForm || !createExpenseForm.checkValidity()) {
        createExpenseForm.classList.add(DATA.bootstrapFormValidated);
        return;
    }

    const selectedCategoriesOptions
        = createExpenseForm.querySelector(SELECTORS.createFormFields.expenseCategories).selectedOptions;

    const selectedCategoriesArray = Array.from(selectedCategoriesOptions).map(({ value }) => ({
        name: value
    }));

    // JSON sent to the API
    const expenseData = {
        categories: selectedCategoriesArray,
        invoice_date_time: createExpenseForm.querySelector(SELECTORS.createFormFields.expenseDate).value,
        price: createExpenseForm.querySelector(SELECTORS.createFormFields.expenseValue).value,
        note: createExpenseForm.querySelector(SELECTORS.createFormFields.expenseNote).value,
        invoice_issuer: createExpenseForm.querySelector(SELECTORS.createFormFields.expenseIssuer).value
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
            Utils.toggleElementVisibility(SELECTORS.noExpensesCard, false);

            Utils.showNotificationMessage('Expense added successfully', "success");

            setupDomEvents();

        })
        .catch(error => {
            console.error('Error creating expense:', error);
            Utils.showNotificationMessage('Unable to create the expense. Please ensure all fields are filled out correctly.', "error");
        });
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
            setupDomEvents();
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

    const newData = [{
        "Date": Utils.stringToFormattedDate(expense.invoice_date_time),
        "Spent": expense.price,
        "Note": expense.note,
        "Issuer": expense.invoice_issuer,
        "Category": categories,
        "Actions": `<button class="btn btn-sm btn-danger delete-expense-btn" 
                    data-bs-toggle="modal" 
                    data-bs-target="${SELECTORS.deleteExpenseEntryModal}" 
                    data-expense-id="${expense.id}">Delete</button>`
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