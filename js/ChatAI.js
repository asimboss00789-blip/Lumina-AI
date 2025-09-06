class ChatAI {
    constructor(options = {}) {
        const defaults = {
            container: '.chat-ai',
            version: '1.0',
            max_messages: 50,
        };
        this.options = Object.assign(defaults, options);
        this.container = document.querySelector(this.options.container);
        this.conversations = [];
        this.selectedConversationIndex = 0;

        this.container.innerHTML = `
            <div class="messages"></div>
            <div class="message-form">
                <input type="text" placeholder="Type a message..." required>
                <button type="button" id="send-button">Send</button>
            </div>
        `;

        this._eventHandlers();
    }

    _eventHandlers() {
        const sendButton = this.container.querySelector('#send-button');
        const inputField = this.container.querySelector('input');

        sendButton.addEventListener('click', () => this.sendMessage());
        inputField.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    appendMessage(message, sender = 'bot') {
        const messagesEl = this.container.querySelector('.messages');
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', sender);
        messageEl.innerHTML = `<div class="text">${message}</div>`;
        messagesEl.appendChild(messageEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    async sendMessage() {
        const inputField = this.container.querySelector('input');
        const message = inputField.value.trim();
        if (!message) return;

        this.appendMessage(message, 'user');
        inputField.value = '';

        this.appendMessage('<span class="blink">_</span>', 'bot');

        try {
            const response = await fetch('/api-call/all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: message })
            });

            const data = await response.json();
            const lastBot = this.container.querySelector('.message.bot:last-child .text');
            lastBot.innerHTML = data.result || 'No response from APIs.';

        } catch (err) {
            console.error(err);
            this.appendMessage('Error connecting to APIs.', 'bot');
        }
    }
}

// Initialize
new ChatAI({ container: '.chat-ai' });
