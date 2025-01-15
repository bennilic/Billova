import {ToastBuilder} from '../builder/builder.js';


/**
 * Use bootstrap toast to show notification message.
 * @param message message to be shown
 * @param type type can be success, error, warning, info
 */
export function showNotificationMessage(message, type="success") {
    const myToast = new ToastBuilder();
    myToast.setBody(message);
    myToast.setType(type);
    myToast.show();
}

export function resetForm(form) {
    form.reset();
    form.classList.remove('was-validated');
}

export function closeModal(modalSelector) {
    const modalElement = document.querySelector(modalSelector);
    const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
}

const DATA_TABLE_DEFAULT_OPTIONS = {
    sortable: true,
    searchable: true,
    fixedHeight: true,
    perPage: 10,
    perPageSelect: [5, 10, 15, 20],
    tableRender: (_data, table, type) => {
        if (type === "print") {
            return table
        }
        const tHead = table.childNodes[0]
        const filterHeaders = {
            nodeName: "TR",
            childNodes: tHead.childNodes[0].childNodes.map(
                (_th, index) => ({nodeName: "TH",
                    childNodes: [
                        {
                            nodeName: "INPUT",
                            attributes: {
                                class: "datatable-input form-control",
                                type: "search",
                                "data-columns": `[${index}]`
                            }
                        }
                    ]})
            )
        }
        tHead.childNodes.push(filterHeaders)
        return table
    }
};

/**
 * Function used to initialize a table using simple-datatables.
 * @param tableSelector - table selector (id or class)
 * @param options - options to be used for the table. This is a default param.
 * If not passed, DATA_TABLE_DEFAULT_OPTIONS will be used.
 */
export function initializeDataTable(tableSelector, options = DATA_TABLE_DEFAULT_OPTIONS) {
    let table = document.querySelector(tableSelector);

    if (!table || typeof simpleDatatables === 'undefined') {
        console.error('Table element or DataTable library not found.');
        return;
    }

    new simpleDatatables.DataTable(table, options);

    // Wait for the DataTable to render its DOM
    setTimeout(() => {
        // Add custom classes to specific elements
        const searchInput = document.querySelector('.datatable-input');
        if (searchInput) {
            searchInput.classList.add('form-control');
        }

        const perPageSelect = document.querySelector('.datatable-dropdown select');
        if (perPageSelect) {
            perPageSelect.classList.add('form-select');
        }
    }, 0);
}
