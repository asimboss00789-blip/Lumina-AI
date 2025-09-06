class ChatAI {
    constructor({ container, apiEndpoints = [], maxMessages = 50 }) {
        this.container = document.querySelector(container);
        this.apiEndpoints = apiEndpoints; // Array of API endpoints
        this.maxMessages = maxMessages;
        this.messages = [];
        this._setupHTML();
        this._setupEvents();
    }

    _setupHTML() {
        // Ensure chat messages container exists
        if (!this.container.querySelector('.messages')) {
            this.container.innerHTML = `
                <div class="messages"></div>
                <div class="message-form">
                    <input type="text" id="chat-input" placeholder="Type a message..." />
                    <button id="send-button">Send</button>
                </div>
            `;
        }
        this.messagesContainer = this.container.querySelector('.messages');
        this.inputField = this.container.querySelector('#chat-input');
        this.sendButton = this.container.querySelector('#send-button');
    }

    _setupEvents() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async sendMessage() {
        const text = this.inputField.value.trim();
        if (!text) return;

        this._appendMessage(text, 'user');
        this.inputField.value = '';
        this.inputField.disabled = true;
        this.sendButton.disabled = true;

        try {
            // Call all APIs in parallel
            const responses = await Promise.all(
                this.apiEndpoints.map(url =>
                    fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ input: text })
                    }).then(res => res.json())
                )
            );

            // Combine all responses into one
            const combinedResponse = responses
                .map(r => r.result || '')
                .filter(Boolean)
                .join(' ');

            this._appendMessage(combinedResponse || 'No response from APIs.', 'assistant');

        } catch (err) {
            console.error(err);
            this._appendMessage('Error connecting to APIs.', 'assistant');
        }

        this.inputField.disabled = false;
        this.sendButton.disabled = false;
        this.inputField.focus();
    }

    _appendMessage(text, role) {
        const msgEl = document.createElement('div');
        msgEl.classList.add('message', role);
        msgEl.innerHTML = `<div class="wrapper">
            <div class="avatar">${role === 'assistant' ? 'AI' : '<i class="fa-solid fa-user"></i>'}</div>
            <div class="details">
                <div class="text">${text.replace(/(?:\r\n|\r|\n)/g, '<br>')}</div>
            </div>
        </div>`;
        this.messagesContainer.appendChild(msgEl);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        // Store message in memory (maxMessages)
        this.messages.push({ role, content: text });
        if (this.messages.length > this.maxMessages) this.messages.shift();
    }
}

// Example usage
const chat = new ChatAI({
    container: '.chat-ai',
    apiEndpoints: [
        '/api/call/huggingface',
        '/api/call/alpha',
        '/api/call/fmp',
        '/api/call/finnhub',
        '/api/call/groq',
        '/api/call/newsapi'
    ],
    maxMessages: 50
});
