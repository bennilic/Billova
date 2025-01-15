import * as Utils from './utils/utils.js';
import {ButtonBuilder, ElementBuilder} from "./builder/builder.js";


const SELECTORS = {
    expenseTable: '#expensesTable',
    expenseTableBody: '.uiExpensesTblBody',
    saveExpenseButton: '#saveExpenseEntryButton',
    deleteExpenseButton: '.delete-expense-btn',
    confirmDeleteExpenseButton: '.confirm-delete-expense-btn',
    createExpenseForm: '#expenseEntryForm',
    deleteExpenseForm: '#deleteExpenseForm',
    deleteExpenseEntryModal: '#deleteExpenseEntryModal',
    createExpenseModal: '#createExpenseEntryModal',
    csrfToken: "[name=csrfmiddlewaretoken]",
    createFormFields: {
        expenseCategory: '#expenseCategory',
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
    populateExpensesTable();
});

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

    // JSON sent to the API
    const expenseData = {
        invoice_date_time: document.querySelector(SELECTORS.createFormFields.expenseDate).value,
        price: document.querySelector(SELECTORS.createFormFields.expenseValue).value,
        note: document.querySelector(SELECTORS.createFormFields.expenseNote).value,
        invoice_issuer: document.querySelector(SELECTORS.createFormFields.expenseIssuer).value
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
    const errorMessage = 'An error occurred while trying to delete the expense.';

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
        return;
    }

    const deleteButton = new ButtonBuilder("button")
        .class("btn btn-sm btn-danger delete-expense-btn")
        .with("data-bs-toggle", "modal")
        .with("data-bs-target", SELECTORS.deleteExpenseEntryModal)
        .with("data-expense-id", expense.id)
        .text("Delete");

    const categories = expense.categories; // TODO implement after beni's changes are merged

    let tableRow = new ElementBuilder("tr")
        .attr({
            'data-expense-id' : expense.id
        })
        .append(new ElementBuilder("td").class("tableDataExpenseDate").text(Utils.stringToFormattedDate(expense.invoice_date_time)))
        .append(new ElementBuilder("td").class("tableDataExpensePrice").text(expense.price))
        .append(new ElementBuilder("td").class("tableDataExpenseNote").text(expense.note))
        .append(new ElementBuilder("td").class("tableDataExpenseIssuer").text(expense.invoice_issuer))
        .append(new ElementBuilder("td").class("tableDataExpenseDate").text(expense.categories))
        .append(new ElementBuilder("td").class("tableDataAction text-center").append(deleteButton));

    tableBody.append(tableRow.element);
}

function showNoExpenseFoundInTable(table = document.querySelector(SELECTORS.expenseTable)) {
    const tableBody = table.querySelector(SELECTORS.expenseTableBody);
    if (!tableBody) {
        return;
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