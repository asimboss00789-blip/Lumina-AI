document.addEventListener('DOMContentLoaded', () => {
    const messagesContainer = document.getElementById('messages');
    const inputField = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    async function callAPI(service, input) {
        // Replace this with your real API call code
        // Example: fetch(`/api-call/${service}`, ...)
        // Here we simulate a delay and a response
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(`Response from ${service}: processed "${input}"`);
            }, Math.random() * 500 + 200);
        });
    }

    async function getCombinedResponse(message) {
        const services = ['huggingface', 'alpha', 'fmp', 'finnhub', 'groq', 'newsapi'];
        const results = await Promise.all(services.map(s => callAPI(s, message)));
        // Combine all responses into one
        return results.join(' | ');
    }

    function appendMessage(content, sender) {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', sender);
        messageEl.textContent = content;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage(e) {
        if (e) e.preventDefault();
        const text = inputField.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        inputField.value = '';
        inputField.disabled = true;
        sendButton.disabled = true;

        try {
            const response = await getCombinedResponse(text);
            appendMessage(response, 'bot');
        } catch (err) {
            appendMessage('Error connecting to APIs.', 'bot');
            console.error(err);
        }

        inputField.disabled = false;
        sendButton.disabled = false;
        inputField.focus();
    }

    sendButton.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage(e);
    });
});
