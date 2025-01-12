import * as Utils from './utils/utils.js';


const SELECTORS = {
    expenseTable: '#expensesTable'
};

document.addEventListener('DOMContentLoaded', function () {
    Utils.initializeVanillaDataTable(SELECTORS.expenseTable);
});