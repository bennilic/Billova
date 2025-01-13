import * as Utils from './utils/utils.js';


const SELECTORS = {
    expenseTable: '#expensesTable',
    saveExpenseButton: '#saveExpenseEntryButton',
    createExpenseForm: '#expenseEntryForm',
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
    bootstrapFormValidated: 'was-validated'
};

document.addEventListener('DOMContentLoaded', function () {
    Utils.initializeVanillaDataTable(SELECTORS.expenseTable);
    setupDomEvents();
});

function setupDomEvents() {
    let saveExpenseButton = document.querySelector(SELECTORS.saveExpenseButton);
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

    // JSON sent to the backend API
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
                throw new Error('Failed to create expense');
            }

            return response.json();
        })
        .then(data => {
            console.log('Expense created:', data);
            Utils.showNotificationMessage('Expense successfully created', "success");

            setTimeout(function () {
                location.reload(); // Reload page to fetch updated expenses TODO maybe update the table instead of reloading the page
            }, 1000);

        })
        .catch(error => {
            console.error('Error creating expense:', error);
            Utils.showNotificationMessage('Error creating Expense entry', "error");
        });
}


function getCsrfTokenFromForm(form) {
    let token = form.querySelector(SELECTORS.csrfToken);
    if (token) {
        return token.value;
    }
    return '';
}