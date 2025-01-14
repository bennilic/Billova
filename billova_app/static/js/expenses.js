import * as Utils from './utils/utils.js';


const SELECTORS = {
    expenseTable: '#expensesTable',
    saveExpenseButton: '#saveExpenseEntryButton',
    deleteExpenseButton: '.delete-expense-btn',
    confirmDeleteExpenseButton: '.confirm-delete-expense-btn',
    createExpenseForm: '#expenseEntryForm',
    deleteExpenseForm: '#deleteExpenseForm',
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
    bootstrapFormValidated: 'was-validated' // used by bootstrap to style invalid forms
};

document.addEventListener('DOMContentLoaded', function () {
    Utils.initializeVanillaDataTable(SELECTORS.expenseTable);
    setupDomEvents();
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
                throw new Error('Failed to create expense');
            }

            return response.json();
        })
        .then(data => {
            Utils.showNotificationMessage('Expense added successfully', "success");

            // wait 1 second before reloading the page in order to show a success message to the user
            setTimeout(function () {
                location.reload(); // Reload page to fetch updated expenses TODO maybe update the table instead of reloading the page
            }, 1000);

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
    if (!toDeleteExpenseId || isNaN(parseInt(toDeleteExpenseId))) {
        return;
    }

    const deleteForm = document.querySelector(SELECTORS.deleteExpenseForm);
    if (!deleteForm) {
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
            if (response.ok) {
                Utils.showNotificationMessage('Expense deleted successfully', "success");

                setTimeout(function () {
                    location.reload(); // Reload page to fetch updated expenses TODO maybe update the table instead of reloading the page
                }, 1000);

            } else {
                throw new Error(`Failed to delete expense: ${response.status}`);
            }
        })
        .catch(error => {
            console.error(error);
            Utils.showNotificationMessage('An error occurred while trying to delete the expense.', "error");
        });
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