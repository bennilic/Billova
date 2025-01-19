// keeps track of which "page" of the paginated API results the user is currently requesting
import {ElementBuilder, ButtonBuilder} from "./builder/builder.js";
import * as Utils from './utils/utils.js';

let currentPage = 1;
let totalMonthsCount = 0;
let countOfMonthsDisplayed = 0;

// number of results to fetch per page
const PAGE_SIZE_NUMBER = 10;

const SELECTORS = {
    noExpensesCard: '.no-expenses-card',
    showMoreButton: '#showMoreButton',
    monthlyExpensesContainer: '#monthlyExpensesContainer',
    accordionItem: '.accordion-item',
    accordionButton: '.accordion-button',
    accordionCollapse: '.accordion-collapse',
    noMoreItemsLeft: '#noMoreItemsInfo'
}

document.addEventListener('DOMContentLoaded', function () {
    loadMonthlyExpenses(currentPage, PAGE_SIZE_NUMBER);

    const showMoreButton = document.querySelector(SELECTORS.showMoreButton);
    if (showMoreButton) {
        showMoreButton.addEventListener('click', function () {
            currentPage++; // Increment the page number
            loadMonthlyExpenses(currentPage); // Load the next page
        });
    }
});

function loadMonthlyExpenses(page) {
    fetch(`/api/v1/monthlyExpenses/?page=${page}`, {
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

            if (isFirstApiRequest()) {
                collapseFirstAccordionItem();
                totalMonthsCount = data.count;
            }

            // keep track how many months we already displayed in order to know when to hide the
            // show more button
            countOfMonthsDisplayed += data.results.length;

            // display the show more button if there are more expenses which can be loaded
            let showButton = totalMonthsCount - countOfMonthsDisplayed >= PAGE_SIZE_NUMBER;
            Utils.toggleElementVisibility(SELECTORS.showMoreButton, showButton);
            Utils.toggleElementVisibility(SELECTORS.noMoreItemsLeft, !showButton);

        })
        .catch(error => {
            Utils.toggleElementVisibility(SELECTORS.showMoreButton, false);

            if (isFirstApiRequest()) {
                Utils.toggleElementVisibility(SELECTORS.noExpensesCard, true);
            }

            Utils.showNotificationMessage('We were unable to load your monthly expenses. Please try again later.', "error");
            console.error('Error fetching monthly expenses:', error);
        });
}

function renderMonthlyExpenses(expenses) {
    const container = document.querySelector(SELECTORS.monthlyExpensesContainer);
    if (!container) {
        return;
    }

    // if this is the first request sent and there is no data, then we show "no expense message"
    // needed only for the first request. The next requests are only sent when the user clicks on the
    // button which means we already show some expenses
    if (isFirstApiRequest() && !expenses.length) {
        Utils.toggleElementVisibility(SELECTORS.noExpensesCard, true);
    }

    expenses.forEach(expense => {
        // Normalize the ID by replacing spaces with dashes
        const normalizedId = `collapse-${expense.month.replace(/\s+/g, '-')}`;

        if (document.getElementById(normalizedId)) {
            console.warn(`Skipping duplicate month: ${expense.month}`);
            return; // Skip duplicates
        }

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

        const categoriesLabel = new ElementBuilder('h5')
            .class('mb-1 fw-bold')
            .text('Categories:');

        const categoriesContent = new ElementBuilder('p')
            .class('mb-7')
            .text(expense.categories.join(', '));

        const totalSpendLabel = new ElementBuilder('h5')
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

function collapseFirstAccordionItem() {
    const expensesContainer = document.querySelector(SELECTORS.monthlyExpensesContainer);
    if (!expensesContainer) {
        console.log('Accordion container not found');
    }

    const firstAccordionItem = expensesContainer.querySelector(SELECTORS.accordionItem);
    if (!firstAccordionItem) {
        console.log('No accordion items found');
    }

    firstAccordionItem.querySelector(SELECTORS.accordionButton).classList.remove('collapsed');
    firstAccordionItem.querySelector(SELECTORS.accordionButton).classList.remove('collapsed');
    firstAccordionItem.querySelector(SELECTORS.accordionCollapse).classList.add('show');
}

function isFirstApiRequest() {
    return currentPage === 1;
}