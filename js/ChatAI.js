class ChatAI {
    constructor(options) {
        const defaults = {
            container: '.chat-ai',
            api_key: '',
            model: 'gpt-3.5-turbo',
            max_tokens: 1000,
            conversations: [],
            selected_conversation: null,
            chat_speed: 20,
            show_tokens: false,
            version: '1.0'
        };
        this.options = Object.assign(defaults, options);
        this.container = document.querySelector(this.options.container);
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="content">
                <div class="messages"></div>
                <div class="message-form">
                    <input type="text" id="chat-input" placeholder="Type your message...">
                    <button id="send-button">Send</button>
                </div>
            </div>
        `;
        this.loadLastConversation();
        this._eventHandlers();
    }

    loadLastConversation() {
        const saved = localStorage.getItem('last_conversation');
        if (saved) {
            this.conversations = JSON.parse(saved);
            if (this.conversations.length > 0) {
                this.selectedConversationIndex = this.conversations.length - 1;
                this.loadConversation(this.selectedConversation);
            }
        }
    }

    _eventHandlers() {
        const sendButton = this.container.querySelector('#send-button');
        const inputField = this.container.querySelector('#chat-input');

        sendButton.addEventListener('click', () => this.sendMessage());
        inputField.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.sendMessage();
        });

        window.addEventListener('beforeunload', () => {
            localStorage.setItem('last_conversation', JSON.stringify(this.conversations));
        });
    }

    appendMessage(message, sender) {
        const chatContainer = this.container.querySelector('.messages');
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', sender, sender === 'assistant' ? 'active' : '');
        messageEl.innerHTML = `
            <div class="wrapper">
                <div class="avatar">${sender === 'assistant' ? 'AI' : '<i class="fa-solid fa-user"></i>'}</div>
                <div class="details"><div class="text">${message}</div></div>
            </div>
        `;
        chatContainer.appendChild(messageEl);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async sendMessage() {
        const inputField = this.container.querySelector('#chat-input');
        const message = inputField.value.trim();
        if (!message) return;

        this.appendMessage(message, 'user');
        inputField.value = '';
        inputField.disabled = true;

        this.appendMessage('<span class="blink">_</span>', 'assistant');

        if (!this.selectedConversation) {
            this.selectedConversationIndex = this.conversations.push({ name: 'StarLink', messages: [] }) - 1;
        }

        this.selectedConversation.messages.push({
            role: 'user',
            content: message,
            date: new Date()
        });

        try {
            const response = await fetch('/api-call/all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: message })
            });

            const data = await response.json();
            const aiMsgEl = this.container.querySelector('.message.assistant.active .text');
            aiMsgEl.querySelector('.blink')?.remove();

            if (data.success) {
                let msg = data.result;
                const textInterval = setInterval(() => {
                    if (msg[0]) {
                        aiMsgEl.innerHTML += msg[0];
                        aiMsgEl.innerHTML = aiMsgEl.innerHTML.replace(/(?:\r\n|\r|\n)/g, '<br>');
                        msg = msg.substring(1);
                        this.container.querySelector('.messages').scrollTop = this.container.querySelector('.messages').scrollHeight;
                    } else {
                        clearInterval(textInterval);
                    }
                }, this.options.chat_speed);

                this.selectedConversation.messages.push({
                    role: 'assistant',
                    content: data.result,
                    date: new Date()
                });
            } else {
                aiMsgEl.innerHTML = 'Error connecting to APIs.';
            }

        } catch (err) {
            console.error(err);
            const aiMsgEl = this.container.querySelector('.message.assistant.active .text');
            aiMsgEl.innerHTML = 'Error connecting to APIs.';
        } finally {
            inputField.disabled = false;
            inputField.focus();
            this.container.querySelector('.message.assistant.active')?.classList.remove('active');

            // Keep only last 50 messages
            if (this.selectedConversation.messages.length > 50) {
                this.selectedConversation.messages = this.selectedConversation.messages.slice(-50);
            }
        }
    }

    get conversations() {
        return this.options.conversations;
    }

    set conversations(value) {
        this.options.conversations = value;
    }

    get selectedConversationIndex() {
        return this.options.selected_conversation;
    }

    set selectedConversationIndex(value) {
        this.options.selected_conversation = value;
    }

    get selectedConversation() {
        return this.conversations[this.selectedConversationIndex];
    }

    set selectedConversation(value) {
        this.conversations[this.selectedConversationIndex] = value;
    }

}

// Initialize ChatAI
new ChatAI({
    container: '.chat-ai'
});
