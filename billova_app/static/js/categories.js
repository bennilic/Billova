import {ButtonBuilder, ElementBuilder} from "./builder/builder.js";
import * as Utils from './utils/utils.js';

const SELECTORS = {
    categoriesList: '.categories-list-group',
    createCategoryNameInput: '#createCategoryName',
    editCategoryNameInput: '#editCategoryName',
    createCategoryModal: '#createCategoryModal',
    editCategoryModal: '#editCategoryModal',
    deleteCategoryModal: '#deleteCategoryModal',
    createCategoryButton: '#saveCreateCategoryButton',
    createCategoryForm: '#createCategoryForm',
    editCategoryForm: '#editCategoryForm',
    deleteCategoryForm: '#deleteCategoryForm',
    saveEditCategoryBtn: '#saveEditCategoryButton',
    editCategoryModalOpenerBtn: '.editCategoryBtn',
    modalTitle: '.modal-title',
    confirmDeleteCategoryBtn: '.confirm-delete-category-btn',
    categoriesSearchInput: '#categoriesSearchInput'
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
        .class('btn btn-secondary btn-sm me-2 editCategoryBtn')
        .attr({
            'data-bs-toggle': 'modal',
            'data-bs-target': SELECTORS.editCategoryModal,
            'data-category-id': category.id,
            'data-category-name': category.name
        });

    const deleteButton = new ButtonBuilder('Delete')
        .class('btn btn-danger btn-sm deleteCategoryBtn')
        .attr({
            'data-bs-toggle': 'modal',
            'data-bs-target': SELECTORS.deleteCategoryModal,
            'data-category-id': category.id,
            'data-category-name': category.name
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
        console.warn('Create category form not found.');
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

function onEditCategoryModalShown(e, formSelector) {
    const editForm = e.currentTarget.querySelector(formSelector);
    if (!editForm) {
        console.warn("The given edit form was not found " + formSelector);
        return;
    }

    const triggerButton = e.relatedTarget;
    const categoryId = parseInt(triggerButton.dataset.categoryId);

    if (isNaN(categoryId)) {
        console.warn('Wrong id format ' + categoryId);
        return;
    }

    // prefill the edit input
    editForm.querySelector(SELECTORS.editCategoryNameInput).value = triggerButton.dataset.categoryName;

    const editCategoryButton = e.currentTarget.querySelector(SELECTORS.saveEditCategoryBtn);

    // Remove any existing event listeners to prevent duplicate calls
    const newConfirmEditHandler = () => updateCategory(categoryId, editForm);
    editCategoryButton.removeEventListener('click', editCategoryButton._confirmEditHandler);
    editCategoryButton._confirmEditHandler = newConfirmEditHandler; // Save reference
    editCategoryButton.addEventListener('click', newConfirmEditHandler);
}

function onDeleteCategoryModalShown(e, formSelector) {
    const deleteForm = e.currentTarget.querySelector(formSelector);
    if (!deleteForm) {
        console.warn("The given delete form was not found " + formSelector);
        return;
    }

    const triggerButton = e.relatedTarget;
    const categoryId = parseInt(triggerButton.dataset.categoryId);

    if (isNaN(categoryId)) {
        console.warn('Wrong id format ' + categoryId);
        return;
    }

    e.currentTarget.querySelector(SELECTORS.modalTitle).innerText
        = "Delete " + triggerButton.dataset.categoryName;

    const confirmDeleteButton = e.currentTarget.querySelector(SELECTORS.confirmDeleteCategoryBtn);

    // Remove any existing event listeners to prevent duplicate calls
    const newConfirmDeleteHandler = () => deleteCategory(categoryId);
    confirmDeleteButton.removeEventListener('click', confirmDeleteButton._confirmDeleteHandler);
    confirmDeleteButton._confirmDeleteHandler = newConfirmDeleteHandler; // Save reference
    confirmDeleteButton.addEventListener('click', newConfirmDeleteHandler);
}

function deleteCategory(categoryId, deleteForm=document.querySelector(SELECTORS.deleteCategoryForm)) {
    if (!categoryId) {
        console.warn('Category ID is not provided or invalid.');
        return;
    }
    if (!deleteForm) {
        console.warn('Delete form was not found.');
        return;
    }

    // Perform the DELETE request to remove the category
    fetch(`/api/v1/categories/${categoryId}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': Utils.getCsrfTokenFromForm(deleteForm)
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to delete category: ${response.statusText}`);
            }

            // Remove the category item from the list dynamically
            removeCategoryListItem(categoryId);

            Utils.closeModal(SELECTORS.deleteCategoryModal);
            Utils.showNotificationMessage('Category deleted successfully', "success");

        })
        .catch(error => {
            console.error('Error deleting category:', error);
            Utils.showNotificationMessage(
                'Unable to delete the category. Please try again later.',
                "error"
            );
        });
}

function updateCategory(categoryId, editForm) {
    if (!editForm) {
        console.warn('Edit form not found');
        return;
    }

    // Validate the form before submission
    if (!editForm.checkValidity()) {
        editForm.classList.add(DATA.bootstrapFormValidated);
        return;
    }

    // Prepare the data to be sent in the API request
    const categoryData = {
        name: editForm.querySelector(SELECTORS.editCategoryNameInput).value
    };

    // Perform the PUT request to update the category
    fetch(`/api/v1/categories/${categoryId}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': Utils.getCsrfTokenFromForm(editForm)
        },
        body: JSON.stringify(categoryData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to update category: ${response.statusText}`);
            }

            return response.json();
        })
        .then(data => {

            updateCategoryListItem(categoryId, data);
            Utils.closeModal(SELECTORS.editCategoryModal);
            Utils.showNotificationMessage('Category updated successfully', "success");

        })
        .catch(error => {
            console.error('Error updating category:', error);
            Utils.showNotificationMessage(
                'Unable to update the category. Please ensure all fields are filled out correctly.',
                "error"
            );
        });
}

function updateCategoryListItem(categoryId, newData) {
    // Find the list item with the matching category ID
    const categoryListItem = document.querySelector(
        `${SELECTORS.categoriesList} [data-category-id="${categoryId}"]`
    );

    if (!categoryListItem) {
        console.warn(`Category list item with ID ${categoryId} not found.`);
        return;
    }

    // Update the text content of the category
    categoryListItem.childNodes[0].textContent = newData.name;

    // Update the data attributes
    categoryListItem.dataset.categoryName = newData.name;
    categoryListItem.querySelector(SELECTORS.editCategoryModalOpenerBtn).dataset.categoryName = newData.name;
}

function removeCategoryListItem(categoryId) {
    const categoryListItem = document.querySelector(
        `${SELECTORS.categoriesList} [data-category-id="${categoryId}"]`
    );

    if (categoryListItem) {
        categoryListItem.remove();
    } else {
        console.warn(`Category list item with ID ${categoryId} not found.`);
    }
}

function filterCategoriesList(e) {
    const searchTerm = e.target.value.toLowerCase();
    const categoriesList = document.querySelectorAll(SELECTORS.categoriesList + ' li');

    categoriesList.forEach(item => {
        const categoryName = item.dataset.categoryName.toLowerCase();

        if (categoryName.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

function setupDomEvents() {
    const createCategoryBtn = document.querySelector(SELECTORS.createCategoryButton);
    if (createCategoryBtn) {
        createCategoryBtn.addEventListener('click', saveCategory);
    }

    const editModal = document.querySelector(SELECTORS.editCategoryModal);
    if (editModal) {
        editModal.addEventListener('shown.bs.modal', (e) => {
            onEditCategoryModalShown(e, SELECTORS.editCategoryForm);
        });
    }

    const deleteModal = document.querySelector(SELECTORS.deleteCategoryModal);
    if (deleteModal) {
        deleteModal.addEventListener('shown.bs.modal', (e) => {
            onDeleteCategoryModalShown(e, SELECTORS.deleteCategoryForm);
        });
    }

    const categoriesSearchInput = document.querySelector(SELECTORS.categoriesSearchInput);
    if (categoriesSearchInput) {
        categoriesSearchInput.addEventListener('input', filterCategoriesList);
    }
}
