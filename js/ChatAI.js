class ChatAI {
    constructor(options = {}) {
        const defaults = {
            container: '.chat-ai',
            version: '1.0',
            available_apis: ['huggingface', 'alpha', 'fmp', 'finnhub', 'groq', 'newsapi'],
            max_tokens: 200,
            show_tokens: true,
            conversations: [],
            selected_conversation: null,
            chat_speed: 10
        };
        this.options = Object.assign(defaults, options);
        this.options.container = document.querySelector(this.options.container);
        this.options.container.innerHTML = `
            ${this._sidebarTemplate()}
            <main class="content">
                ${this._welcomePageTemplate()}
                <div class="messages"></div>
                <form class="message-form">
                    <input type="text" placeholder="Type a message..." required>
                    <button type="submit"><i class="fa-solid fa-paper-plane"></i> Send</button>
                </form>
            </main>
        `;
        this._eventHandlers();
        this.container.querySelector('.message-form input').focus();
    }

    _welcomePageTemplate() {
        return `
            <div class="welcome">
                <h1>StarLink<span class="ver">${this.options.version}</span></h1>
            </div>
        `;
    }

    _sidebarTemplate() {
        return `
            <a href="#" class="open-sidebar" title="Open Sidebar"><i class="fa-solid fa-bars"></i></a>
            <nav class="conversations">
                <a class="new-conversation" href="#"><i class="fa-solid fa-plus"></i> New Conversation</a>
                <div class="list"></div>
                <div class="footer">
                    <a class="close-sidebar" href="#" title="Close Sidebar"><i class="fa-solid fa-bars"></i></a>
                </div>
            </nav>
        `;
    }

    _eventHandlers() {
        const sendButton = this.container.querySelector('.message-form button');
        const inputField = this.container.querySelector('.message-form input');
        const self = this;

        // Send message event
        this.container.querySelector('.message-form').onsubmit = event => {
            event.preventDefault();
            self.sendMessage(inputField.value.trim());
            inputField.value = '';
        };

        // New conversation
        this.container.querySelector('.new-conversation').onclick = e => {
            e.preventDefault();
            this.createNewConversation();
        };
    }

    createNewConversation(title = null) {
        title = title || 'Conversation ' + (this.options.conversations.length + 1);
        const index = this.options.conversations.push({ name: title, messages: [] }) - 1;
        const convLink = document.createElement('a');
        convLink.href = '#';
        convLink.className = 'conversation selected';
        convLink.dataset.id = index;
        convLink.innerHTML = `<i class="fa-regular fa-message"></i>${title}`;
        this.container.querySelector('.conversations .list').appendChild(convLink);
        this.options.selected_conversation = index;
        this.clearMessages();
        this.loadConversation(this.selectedConversation);
        this._conversationClickHandlers();
        return index;
    }

    _conversationClickHandlers() {
        this.container.querySelectorAll('.conversations .list a').forEach(link => {
            link.onclick = e => {
                e.preventDefault();
                this.container.querySelectorAll('.conversations .list a').forEach(c => c.classList.remove('selected'));
                link.classList.add('selected');
                this.options.selected_conversation = parseInt(link.dataset.id);
                this.loadConversation(this.selectedConversation);
            };
        });
    }

    get selectedConversation() {
        return this.options.conversations[this.options.selected_conversation];
    }

    loadConversation(conv) {
        this.clearWelcomeScreen();
        const msgContainer = this.container.querySelector('.content .messages');
        msgContainer.innerHTML = '';
        if (!conv) return;
        conv.messages.forEach(m => {
            const div = document.createElement('div');
            div.className = `message ${m.role}`;
            div.innerHTML = `
                <div class="wrapper">
                    <div class="avatar">${m.role === 'assistant' ? 'AI' : '<i class="fa-solid fa-user"></i>'}</div>
                    <div class="details">
                        <div class="date" title="${m.date}">${this.formatElapsedTime(m.date)}</div>
                        <div class="text">${m.content}</div>
                    </div>
                </div>
            `;
            msgContainer.appendChild(div);
        });
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    clearMessages() {
        const msgContainer = this.container.querySelector('.content .messages');
        if (msgContainer) msgContainer.innerHTML = '';
    }

    clearWelcomeScreen() {
        const welcome = this.container.querySelector('.content .welcome');
        if (welcome) welcome.remove();
    }

    formatElapsedTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 1) return `${days} days ago`;
        else if (days === 1) return 'Yesterday';
        else if (hours > 0) return `${hours} hours ago`;
        else if (minutes > 0) return `${minutes} minutes ago`;
        return `${seconds} seconds ago`;
    }

    async sendMessage(message) {
        if (!message) return;
        const date = new Date();
        // Add user message
        this.selectedConversation.messages.push({ role: 'user', content: message, date });
        this.loadConversation(this.selectedConversation);

        // Add placeholder AI message
        const aiMessage = { role: 'assistant', content: '', date };
        this.selectedConversation.messages.push(aiMessage);
        this.loadConversation(this.selectedConversation);

        const combinedResponse = await this.callAllAPIs(message);

        aiMessage.content = combinedResponse;
        this.loadConversation(this.selectedConversation);
    }

    async callAllAPIs(input) {
        const results = await Promise.all(this.options.available_apis.map(async api => {
            // Replace this with actual API call
            return `${api.toUpperCase()} says: ${input}`;
        }));
        return results.join('<br>');
    }
}

// Initialize
new ChatAI({
    container: '.chat-ai'
});
