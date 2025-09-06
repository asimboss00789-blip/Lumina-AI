class ChatAI {
    constructor(options) {
        const defaults = {
            container: '.chat-ai',
            title: 'StarLink Chat',
            apiRoute: '/api/api-call/all',
            maxMessages: 50,
            chat_speed: 20,
        };
        this.options = Object.assign(defaults, options);
        this.container = document.querySelector(this.options.container);

        // Initial setup
        this.selectedConversationIndex = null;
        this.conversations = [];
        this.container.innerHTML = `
            <div class="conversations">
                <a class="new-conversation" href="#">+ New Conversation</a>
                <div class="list"></div>
            </div>
            <div class="content">
                <div class="messages"></div>
                <div class="message-form">
                    <input type="text" placeholder="Type your message..." required>
                    <button id="send-button">Send</button>
                </div>
            </div>
        `;

        this._eventHandlers();
    }

    _eventHandlers() {
        // New conversation button
        this.container.querySelector('.new-conversation').onclick = (e) => {
            e.preventDefault();
            this.createNewConversation();
        };

        // Send button
        const sendButton = this.container.querySelector('#send-button');
        const inputField = this.container.querySelector('.message-form input');

        sendButton.onclick = () => this.sendMessage();
        inputField.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    createNewConversation() {
        const title = `Conversation ${this.conversations.length + 1}`;
        const index = this.conversations.push({ name: title, messages: [] }) - 1;
        this.selectedConversationIndex = index;

        const convList = this.container.querySelector('.conversations .list');
        const convEl = document.createElement('a');
        convEl.href = '#';
        convEl.className = 'conversation selected';
        convEl.dataset.id = index;
        convEl.textContent = title;
        convList.appendChild(convEl);

        convEl.onclick = (e) => {
            e.preventDefault();
            this.selectedConversationIndex = index;
            this.loadConversation();
        };

        this.clearMessages();
        this.updateTitle();
    }

    get selectedConversation() {
        return this.conversations[this.selectedConversationIndex];
    }

    clearMessages() {
        const messagesEl = this.container.querySelector('.messages');
        messagesEl.innerHTML = '';
    }

    loadConversation() {
        this.clearMessages();
        const messagesEl = this.container.querySelector('.messages');
        this.selectedConversation.messages.forEach(msg => {
            const msgEl = document.createElement('div');
            msgEl.className = `message ${msg.sender}`;
            msgEl.innerHTML = `
                <div class="wrapper">
                    <div class="avatar">${msg.sender === 'bot' ? 'AI' : '<i class="fa-solid fa-user"></i>'}</div>
                    <div class="details">
                        <div class="text">${msg.message.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
            `;
            messagesEl.appendChild(msgEl);
        });
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    async sendMessage() {
        const inputField = this.container.querySelector('.message-form input');
        const text = inputField.value.trim();
        if (!text) return;

        // Add user message
        this.selectedConversation.messages.push({
            sender: 'user',
            message: text,
            timestamp: Date.now()
        });
        if (this.selectedConversation.messages.length > this.options.maxMessages) {
            this.selectedConversation.messages = this.selectedConversation.messages.slice(-this.options.maxMessages);
        }
        this.loadConversation();
        inputField.value = '';
        inputField.disabled = true;

        // Show bot placeholder
        const messagesEl = this.container.querySelector('.messages');
        const botMsgEl = document.createElement('div');
        botMsgEl.className = 'message bot';
        botMsgEl.innerHTML = `
            <div class="wrapper">
                <div class="avatar">AI</div>
                <div class="details">
                    <div class="text"><span class="blink">_</span></div>
                </div>
            </div>
        `;
        messagesEl.appendChild(botMsgEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        // Call backend API
        try {
            const response = await fetch(this.options.apiRoute, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: text })
            });
            const data = await response.json();

            // Replace bot placeholder
            const botTextEl = botMsgEl.querySelector('.text');
            botTextEl.innerHTML = '';
            let msg = data.result || 'No response';
            const interval = setInterval(() => {
                if (msg.length > 0) {
                    botTextEl.innerHTML += msg[0];
                    msg = msg.substring(1);
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                } else {
                    clearInterval(interval);
                    this.selectedConversation.messages.push({
                        sender: 'bot',
                        message: data.result,
                        timestamp: Date.now()
                    });
                    inputField.disabled = false;
                }
            }, this.options.chat_speed);

        } catch (err) {
            console.error(err);
            botMsgEl.querySelector('.text').textContent = 'Error connecting to API.';
            inputField.disabled = false;
        }
    }

    updateTitle() {
        document.title = this.selectedConversation ? `StarLink - ${this.selectedConversation.name}` : 'StarLink';
    }
}

// Initialize
new ChatAI({
    container: '.chat-ai',
});
