// keeps track of which "page" of the paginated API results the user is currently requesting
import {ElementBuilder, ButtonBuilder} from "./builder/builder.js";

let currentPage = 1;
// number of results to fetch per page
const pageSize = 10;

document.addEventListener('DOMContentLoaded', function () {
    loadMonthlyExpenses(currentPage, pageSize);

    const showMoreButton = document.querySelector('#showMoreButton');
    if (showMoreButton) {
        showMoreButton.addEventListener('click', function () {
            currentPage++; // Increment the page number
            loadMonthlyExpenses(currentPage, pageSize); // Load the next page
        });
    }
});

function loadMonthlyExpenses(page, size) {
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

    let iterations = 0;

    expenses.forEach(expense => {
        const monthCard = new ElementBuilder('div')
            .class('accordion-item');

        const accordionButton = new ButtonBuilder()
            .class("accordion-button collapsed")
            .with("data-bs-target", `#collapse-${expense.month}`)
            .with("data-bs-toggle", "collapse")
            .text(`${expense.month}`);

        const monthHeader = new ElementBuilder('h2')
            .class('accordion-header')
            .append(accordionButton);

        const monthBody = new ElementBuilder('div')
            .class('accordion-collapse collapse')
            .id(`collapse-${expense.month}`)
            .append(new ElementBuilder('div')
                .class('accordion-body')
                .innerHTML(`Categories: ${expense.categories.join(', ')}`)
            );

        monthCard.append(monthHeader);
        monthCard.append(monthBody);

        monthCard.appendTo(container);

        iterations++;
    });
}