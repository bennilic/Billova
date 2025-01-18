// keeps track of which "page" of the paginated API results the user is currently requesting
import {ElementBuilder, ButtonBuilder} from "./builder/builder.js";

let currentPage = 1;

// number of results to fetch per page
const FIRST_PAGE_SIZE_NUMBER = 10;
const LOAD_MORE_PAGE_SIZE_NUMBER = 5;

document.addEventListener('DOMContentLoaded', function () {
    loadMonthlyExpenses(currentPage, FIRST_PAGE_SIZE_NUMBER);

    const showMoreButton = document.querySelector('#showMoreButton');
    if (showMoreButton) {
        showMoreButton.addEventListener('click', function () {
            currentPage++; // Increment the page number
            loadMonthlyExpenses(currentPage, LOAD_MORE_PAGE_SIZE_NUMBER); // Load the next page
        });
    }
});

function loadMonthlyExpenses(page, size=FIRST_PAGE_SIZE_NUMBER) {
    fetch(`/api/v1/monthlyExpenses/?page=${page}&page_size=${size}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            renderMonthlyExpenses(data.results);

            // Hide the "Show More" button if fewer results are returned than requested
            if (data.results.length < size) {
                document.querySelector('#showMoreButton').classList.add('hidden');
            }
        })
        .catch(error => {
            console.error('Error fetching monthly expenses:', error);
        });
}

function renderMonthlyExpenses(expenses) {
    const container = document.querySelector('#monthlyExpensesContainer');
    if (!container) {
        return;
    }

    expenses.forEach(expense => {
        // Normalize the ID by replacing spaces with dashes
        const normalizedId = `collapse-${expense.month.replace(/\s+/g, '-')}`;

        const monthCard = new ElementBuilder('div')
            .class('accordion-item');

        const accordionButton = new ButtonBuilder()
            .class("accordion-button collapsed")
            .with("data-bs-target", `#${normalizedId}`)
            .with("data-bs-toggle", "collapse")
            .text(`${expense.month}`);

        const monthHeader = new ElementBuilder('h2')
            .class('accordion-header')
            .append(accordionButton);

        const categoriesLabel = new ElementBuilder('p')
            .class('mb-1 fw-bold')
            .text('Categories:');

        const categoriesContent = new ElementBuilder('p')
            .class('mb-5')
            .text(expense.categories.join(', '));

        const totalSpendLabel = new ElementBuilder('p')
            .class('mb-1 fw-bold')
            .text('Total Spend:');

        const totalSpendContent = new ElementBuilder('p')
            .class('mb-0')
            .text(`$${expense.total_spent}`);

        const accordionBody = new ElementBuilder('div')
            .class('accordion-body mt-5')
            .append(categoriesLabel)
            .append(categoriesContent)
            .append(totalSpendLabel)
            .append(totalSpendContent);

        const monthBody = new ElementBuilder('div')
            .class('accordion-collapse collapse')
            .id(normalizedId)
            .append(accordionBody);

        // Combine header and body
        monthCard.append(monthHeader);
        monthCard.append(monthBody);

        // Append to container
        monthCard.appendTo(container);
    });
}