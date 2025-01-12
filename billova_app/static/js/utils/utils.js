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
