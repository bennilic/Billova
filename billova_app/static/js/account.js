document.addEventListener('DOMContentLoaded', function () {
    const confirmDeleteForm = document.getElementById('confirmDeleteForm');
    const usernameInput = document.getElementById('usernameConfirmation');
    const usernameError = document.getElementById('usernameError');
    const currentUsername = "{{ user.username }}"; // Replace with Django's user context

    confirmDeleteForm.addEventListener('submit', function (e) {
        if (usernameInput.value !== currentUsername) {
            e.preventDefault();
            usernameError.classList.remove('d-none');
            usernameError.textContent = "The entered username does not match your current username.";
        }
    });
});
