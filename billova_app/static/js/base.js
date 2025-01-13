// TODO add logic when a page is loaded to make the nav item active of the specific page by removing the active class on the other nav-items and add it on the selected one
document.addEventListener("DOMContentLoaded", function () {
    const toastElements = document.querySelectorAll('.toast'); // Select all toast elements
    toastElements.forEach(function (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    });
});

document.addEventListener("DOMContentLoaded", function () {
    // Initialize Bootstrap dropdowns
    const dropdownElements = document.querySelectorAll('.dropdown-toggle');
    dropdownElements.forEach(function (dropdown) {
        new bootstrap.Dropdown(dropdown);
    });
});