import * as Utils from './utils/utils.js';
import {ButtonBuilder, ElementBuilder} from "./builder/builder.js";


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
    vanillaDataTableInstance: undefined
};

document.addEventListener('DOMContentLoaded', function () {
    const modalOpenerBtn = document.querySelector(SELECTORS.createExpenseModalOpenerBtn);
    if (modalOpenerBtn) {
        modalOpenerBtn.addEventListener('click', onModalCreateModalBtnOpenerClick);
    }

    populateExpensesTable();
});

function onModalCreateModalBtnOpenerClick() {
    // guard - no need to recreate the categories list if already done. This happens when the user opened the
    // modal dialog before
    if (isCategoriesListAlreadyCreated()) {
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

    const deleteExpenseButtons = document.querySelectorAll(SELECTORS.deleteExpenseButton);

    if (deleteExpenseButtons) {
        deleteExpenseButtons.forEach(button => {
            button.addEventListener('click', onDeleteExpenseButtonClick);
        });
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
            Utils.showNotificationMessage('Expense added successfully', "success");

            addExpenseToTable(data);
            reinitializeVanillaDataTable();
            setupDomEvents();

        })
        .catch(error => {
            console.error('Error creating expense:', error);
            Utils.showNotificationMessage('Unable to create the expense. Please ensure all fields are filled out correctly.', "error");
        });
}

function onDeleteExpenseButtonClick(e) {
    const confirmDeleteExpenseButton = document.querySelector(SELECTORS.confirmDeleteExpenseButton);
    if (!confirmDeleteExpenseButton) {
        return;
    }

    // the id of the expense is set as data attribute on the confirm button. When the button is clicked,
    // we will then use the value in the data attribute for the REST Delete method
    confirmDeleteExpenseButton.dataset.expenseId = e.currentTarget.dataset.expenseId;
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

            removeExpenseTableEntry(toDeleteExpenseId);
            reinitializeVanillaDataTable();

            Utils.closeModal(SELECTORS.deleteExpenseEntryModal);
            Utils.showNotificationMessage('Expense deleted successfully', "success");

        })
        .catch(error => {
            console.error(error);
            Utils.showNotificationMessage(errorMessage, "error");
        });
}

function populateExpensesTable() {
    fetch('/api/v1/expenses/', {
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
                throw new Error("Error fetching expenses");
            }

            addListExpensesToTable(data.results);
            reinitializeVanillaDataTable();
            setupDomEvents();

        })
        .catch(error => {
            console.error(error.message);
            Utils.showNotificationMessage('We were unable to load your expense list. Please try again later.', "error");
        });
}

function addListExpensesToTable(expenses) {
    const expensesTable = document.querySelector(SELECTORS.expenseTable);
    if (!expensesTable) {
        showNoExpenseFoundInTable(expensesTable);
        throw new Error("No expenses table found");
    }

    if (!expenses) {
        showNoExpenseFoundInTable(expensesTable);
        throw new Error("List with expenses not provided");
    }

    if (!expenses.length) {
        showNoExpenseFoundInTable(expensesTable);
        return;
    }

    expenses.forEach(expense => {
        addExpenseToTable(expense);
    });
}

function addExpenseToTable(expense, table=document.querySelector(SELECTORS.expenseTable)) {
    const tableBody = table.querySelector(SELECTORS.expenseTableBody);
    if (!tableBody) {
        throw new Error('Table body not found');
    }

    const deleteButton = new ButtonBuilder("button")
        .class("btn btn-sm btn-danger delete-expense-btn")
        .with("data-bs-toggle", "modal")
        .with("data-bs-target", SELECTORS.deleteExpenseEntryModal)
        .with("data-expense-id", expense.id)
        .text("Delete");

    let categories = '';
    if (expense.categories && expense.categories.length) {
        categories = expense.categories.map(category => category.name).join(', ');
    }

    let tableRow = new ElementBuilder("tr")
        .attr({
            'data-expense-id' : expense.id
        })
        .append(new ElementBuilder("td").class("tableDataExpenseDate").text(Utils.stringToFormattedDate(expense.invoice_date_time)))
        .append(new ElementBuilder("td").class("tableDataExpensePrice").text(expense.price))
        .append(new ElementBuilder("td").class("tableDataExpenseNote").text(expense.note))
        .append(new ElementBuilder("td").class("tableDataExpenseIssuer").text(expense.invoice_issuer))
        .append(new ElementBuilder("td").class("tableDataExpenseDate").text(categories))
        .append(new ElementBuilder("td").class("tableDataAction text-center").append(deleteButton));

    tableBody.append(tableRow.element);
}

function showNoExpenseFoundInTable(table = document.querySelector(SELECTORS.expenseTable)) {
    const tableBody = table.querySelector(SELECTORS.expenseTableBody);
    if (!tableBody) {
        throw new Error('Table body not found');
    }

    let tableRow = new ElementBuilder("tr")
        .append(new ElementBuilder("td").class("text-center").text("No expenses found."));

    tableBody.append(tableRow.element);
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

function removeExpenseTableEntry(expenseId) {
    const toRemoveTableRow = document.querySelector(`tr[data-expense-id="${expenseId}"]`);
    if (toRemoveTableRow) {
        toRemoveTableRow.remove();
    }
}

function reinitializeVanillaDataTable() {
    if (DATA.vanillaDataTableInstance) {
        // first destroy it
        DATA.vanillaDataTableInstance.destroy();
    }

    // then initialize it
    DATA.vanillaDataTableInstance = Utils.initializeVanillaDataTable(SELECTORS.expenseTable);
}

function isCategoriesListAlreadyCreated() {
    const selectList = document.querySelector('#expenseCategories');
    return selectList && selectList.options.length > 1; // one option is always the default one ('Select a category...')
}