document.addEventListener("DOMContentLoaded", function () {
    const toastElements = document.querySelectorAll('.toast'); // Select all toast elements
    toastElements.forEach(function (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    });
});