function showStatusMessage(message, type = 'info') {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = 'show';
    statusMessage.classList.add(type);

    setTimeout(() => {
        statusMessage.className = statusMessage.className.replace('show', '');
    }, 5000);
}
