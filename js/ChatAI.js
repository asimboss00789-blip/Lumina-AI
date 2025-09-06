class ChatAI {
    constructor(options) {
        const defaults = {
            container: '.chat-ai',
            version: '1.0',
            api_keys: {},
            max_messages: 50,
            chat_speed: 20,
            show_tokens: false,
            conversations: [],
            selected_conversation: null,
            model: 'gpt-3.5-turbo',
            source: 'all'
        };
        this.options = Object.assign(defaults, options);
        this.container = document.querySelector(this.options.container);

        // Initialize chat area
        this.container.innerHTML = `
            <div class="messages"></div>
            <div class="message-form">
                <input type="text" placeholder="Type a message..." required>
                <button type="button" id="send-button">Send</button>
            </div>
        `;

        this._eventHandlers();
        this.loadLastConversation();
    }

    _eventHandlers() {
        const sendBtn = this.container.querySelector('#send-button');
        const inputField = this.container.querySelector('.message-form input');

        sendBtn.onclick = () => this.sendMessage();
        inputField.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async sendMessage() {
        const inputField = this.container.querySelector('.message-form input');
        const message = inputField.value.trim();
        if (!message) return;

        this.appendMessage(message, 'user');
        inputField.value = '';
        inputField.disabled = true;

        try {
            const res = await fetch('/api-call/all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: message })
            });
            const data = await res.json();
            if (data.success) {
                this.appendMessage(data.result, 'assistant');
            } else {
                this.appendMessage('Error connecting to APIs.', 'assistant');
            }
        } catch (err) {
            console.error(err);
            this.appendMessage('Error connecting to APIs.', 'assistant');
        }

        inputField.disabled = false;
        inputField.focus();
        this.saveMessage(message, 'user');
        this.saveMessage(data?.result || '', 'assistant');
    }

    appendMessage(message, sender) {
        const messagesEl = this.container.querySelector('.messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ' + sender;
        msgDiv.innerHTML = `<div class="wrapper">
            <div class="avatar">${sender === 'assistant' ? 'AI' : '<i class="fa-solid fa-user"></i>'}</div>
            <div class="details"><div class="text">${message.replace(/(?:\r\n|\r|\n)/g, '<br>')}</div></div>
        </div>`;
        messagesEl.appendChild(msgDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    saveMessage(content, role) {
        if (!this.options.selected_conversation) {
            this.createConversation('StarLink');
        }
        const convo = this.options.conversations[this.options.selected_conversation];
        convo.messages.push({ role, content, date: new Date() });
        if (convo.messages.length > this.options.max_messages) {
            convo.messages = convo.messages.slice(-this.options.max_messages);
        }
        localStorage.setItem('chat_data', JSON.stringify(this.options.conversations));
    }

    loadLastConversation() {
        const data = localStorage.getItem('chat_data');
        if (data) {
            this.options.conversations = JSON.parse(data);
            this.options.selected_conversation = this.options.conversations.length - 1;
            const convo = this.options.conversations[this.options.selected_conversation];
            convo.messages.forEach(msg => this.appendMessage(msg.content, msg.role));
        }
    }

    createConversation(title) {
        const convoIndex = this.options.conversations.push({ name: title, messages: [] }) - 1;
        this.options.selected_conversation = convoIndex;
        return convoIndex;
    }
}

// Initialize
new ChatAI({
    container: '.chat-ai'
});
