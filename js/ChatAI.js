document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.querySelector('.messages');
    const inputField = document.querySelector('#chat-input');
    const sendButton = document.querySelector('#send-button');

    // Append a message to the chat
    function appendMessage(message, sender) {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', sender);
        messageEl.textContent = message;
        chatContainer.appendChild(messageEl);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Send user message and get bot response
    async function sendMessage() {
        const message = inputField.value.trim();
        if (!message) return;

        appendMessage(message, 'user');
        inputField.value = '';

        // Choose API dynamically based on your preference
        // Options: huggingface, alpha, fmp, finnhub, groq, newsapi
        const selectedAPI = 'huggingface'; // change as needed

        try {
            const response = await fetch(`/api/call/${selectedAPI}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: message })
            });

            const data = await response.json();
            appendMessage(data.result || 'Sorry, no response from API.', 'bot');

        } catch (err) {
            console.error(err);
            appendMessage('Error connecting to API.', 'bot');
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage();
    });
});
