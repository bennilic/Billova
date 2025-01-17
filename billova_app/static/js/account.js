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

document.addEventListener('DOMContentLoaded', function () {
    const confirmDeleteForm = document.getElementById('confirmDeleteForm');
    const usernameInput = document.getElementById('usernameConfirmation');
    const usernameError = document.getElementById('usernameError');
    const currentUsername = "{{ user.username }}"; // Replace with Django's user context

    confirmDeleteForm.addEventListener('submit', function (e) {
        // Reset error state
        usernameError.classList.add('d-none');
        usernameInput.classList.remove('is-invalid');

        // Check if the username matches
        if (usernameInput.value.trim() !== currentUsername) {
            e.preventDefault(); // Prevent submission if usernames don't match
            usernameError.classList.remove('d-none'); // Show error message
            usernameError.textContent = "The entered username does not match your current username.";
            usernameInput.classList.add('is-invalid');
        }
    });
});