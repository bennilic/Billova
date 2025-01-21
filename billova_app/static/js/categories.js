import {ElementBuilder, ButtonBuilder} from "./builder/builder.js";
import * as Utils from './utils/utils.js';

const SELECTORS = {
    categoriesList: '.categories-list-group',
    deleteCategoriesModalTitle: '#deleteCategoryModalTitle',
    createCategoryNameInput: '#createCategoryName',
    editCategoryNameInput: '#editCategoryName',
    createCategoryModal: '#createCategoryModal',
    editCategoryModal: '#editCategoryModal',
    deleteCategoryModal: '#deleteCategoryModal',
    createCategoryButton: '#saveCreateCategoryButton',
    createCategoryForm: '#createCategoryForm',
    editCategoryForm: '#editCategoryForm'
};

const DATA = {
    bootstrapFormValidated: 'was-validated' // used by bootstrap to style invalid forms
};

document.addEventListener('DOMContentLoaded', function () {
    setupDomEvents();
    populateCategoriesList();
});

function populateCategoriesList() {
    fetchAllCategories()
        .then(categories => {
            addCategoriesToList(categories);
        })
        .catch(error => {
            console.error(error.message);
            Utils.showNotificationMessage('We were unable to load your categories. Please try again later.', "error");
        })
}

/**
 * Fetch all categories asynchronous.
 * We are using django pagination, this means we always get 10 results for each request.
 * In the categories list, we want to load all the data at once, since there should not be
 * so many categories for one user.
 */
async function fetchAllCategories() {
    let url = '/api/v1/categories/';
    let categories = [];

    // Iterate over all the available result pages and create a new request for each of them
    while (url) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();
        categories.push(...data.results); // Add current page results
        url = data.next; // Get the next page URL
    }

    return categories;
}

function addCategoriesToList(categories) {
    const categoriesList = document.querySelector(SELECTORS.categoriesList);
    if (!categoriesList) {
        throw new Error("No categories list found");
    }

    if (!categories) {
        throw new Error("List with categories not provided");
    }

    if (!categories.length) {
        // TODO maybe some <p> that no categories here
        return;
    }

    categories.forEach(category => {
        addCategoryToList(category, categoriesList);
    })
}

function addCategoryToList(category, categoriesList=document.querySelector(SELECTORS.categoriesList)) {
    if (!categoriesList) {
        throw new Error("Categories list element is not available in the DOM.");
    }

    // Create a list group item
    const listItem = new ElementBuilder('li')
        .class('list-group-item d-flex justify-content-between align-items-center')
        .attr({
            'data-category-id': category.id,
            'data-category-name': category.name
        })
        .text(category.name);

    const editButton = new ButtonBuilder('Edit')
        .class('btn btn-secondary btn-sm me-2')
        .attr({
            'data-bs-toggle': 'modal',
            'data-bs-target': SELECTORS.editCategoryModal
        });

    const deleteButton = new ButtonBuilder('Delete')
        .class('btn btn-danger btn-sm')
        .attr({
            'data-bs-toggle': 'modal',
            'data-bs-target': SELECTORS.deleteCategoryModal
        });

    const buttonContainer = new ElementBuilder('div')
        .class('d-flex')
        .append(editButton)
        .append(deleteButton);

    listItem.append(buttonContainer);
    listItem.appendTo(categoriesList);
}

function saveCategory() {
    const createCategoryForm = document.querySelector(SELECTORS.createCategoryForm);
    if (!createCategoryForm) {
        console.log('Create category form not found.');
        return;
    }

    // make sure the required fields are fulfilled
    if (!createCategoryForm.checkValidity()) {
        createCategoryForm.classList.add(DATA.bootstrapFormValidated);
        return;
    }

    // JSON data sent to the API
    const categoryData = {
        name: createCategoryForm.querySelector(SELECTORS.createCategoryNameInput).value
    };

    // Perform the POST request to create a category
    fetch('/api/v1/categories/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': Utils.getCsrfTokenFromForm(createCategoryForm)
        },
        body: JSON.stringify(categoryData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create category ' + response.statusText);
            }

            return response.json();
        })
        .then(data => {
            // Close the modal after success
            Utils.closeModal(SELECTORS.createCategoryModal);

            // Add the new category to the list dynamically
            const categoriesList = document.querySelector(SELECTORS.categoriesList);
            addCategoryToList(data, categoriesList);

            // Show a success notification
            Utils.showNotificationMessage('Category added successfully', "success");
        })
        .catch(error => {
            console.error('Error creating category:', error);
            Utils.showNotificationMessage(
                'Unable to create the category. Please ensure all fields are filled out correctly.',
                "error"
            );
        });
}

function setupDomEvents() {
    const createCategoryBtn = document.querySelector(SELECTORS.createCategoryButton);
    if (createCategoryBtn) {
        createCategoryBtn.addEventListener('click', saveCategory);
    }
}
