class ChatAI {
    constructor(options = {}) {
        const defaults = {
            container: '.chat-ai',
            api_key: '',
            source: 'huggingface', // Default API
            available_sources: ['huggingface', 'alphavantage', 'fmp', 'finnhub', 'groq', 'newsapi'],
            model: '',
            max_tokens: 200,
            conversations: [],
            selected_conversation: null,
            chat_speed: 5,
            version: '2.0',
            title: 'ChatAI'
        };

        this.options = Object.assign({}, defaults, options);
        this.container = document.querySelector(this.options.container);
        this.APIKey = this.options.api_key;
        this.model = this.options.model;

        this.container.innerHTML = `
            ${this._sidebarTemplate()}
            <main class="content">               
                ${this._welcomePageTemplate()}
                <form class="message-form">
                    <input type="text" placeholder="Type a message..." required>
                    <button type="submit"><i class="fa-solid fa-paper-plane"></i></button>
                </form>
            </main>
        `;

        let settings = this.getSettings();
        if (settings) this.options = Object.assign(this.options, settings);

        this._eventHandlers();
        this.container.querySelector('.message-form input').focus();
    }

    async getMessage() {
        this.container.querySelector('.content .messages').scrollTop =
            this.container.querySelector('.content .messages').scrollHeight;

        let messages = [
            { role: 'system', content: 'You are a helpful assistant.' },
            ...this.selectedConversation.messages
        ].map(m => ({ role: m.role, content: m.content }));

        const selectedAPI = this.source || 'huggingface';

        try {
            const response = await fetch(`/api/call/${selectedAPI}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: messages })
            });

            const data = await response.json();

            if (data.error) {
                this.showErrorMessage(data.error);
                return;
            }

            this.container.querySelector('.message.assistant.active .blink')?.remove();
            let msg = data.result || 'No response from API.';
            let msgElement = this.container.querySelector('.message.assistant.active .text');

            let textInterval = setInterval(() => {
                if (msg[0]) {
                    msgElement.innerHTML += msg[0];
                    msgElement.innerHTML = msgElement.innerHTML.replace(/(?:\r\n|\r|\n)/g, '<br>');
                    msg = msg.substring(1);
                } else {
                    clearInterval(textInterval);
                    this.container.querySelector('.message-form input').disabled = false;
                    this.container.querySelector('.message.assistant.active').classList.remove('active');
                    this.selectedConversation.messages.push({
                        role: 'assistant',
                        content: data.result,
                        date: new Date()
                    });
                }
                this.container.querySelector('.content .messages').scrollTop =
                    this.container.querySelector('.content .messages').scrollHeight;
            }, this.options.chat_speed);

        } catch (err) {
            console.error(err);
            this.showErrorMessage('Error connecting to API.');
        }
    }

    // ======= Utility & UI Methods =======
    getSettings() {
        return localStorage.getItem('settings') ? JSON.parse(localStorage.getItem('settings')) : false;
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify({
            api_key: this.APIKey,
            max_tokens: this.maxTokens,
            source: this.source,
            model: this.model
        }));
    }

    showErrorMessage(message) {
        this.container.querySelectorAll('.error-toast').forEach(e => e.remove());
        let error = document.createElement('div');
        error.classList.add('error-toast');
        error.innerHTML = message;
        this.container.appendChild(error);
        error.getBoundingClientRect();
        error.style.transition = 'opacity .5s ease-in-out 4s';
        error.style.opacity = 0;
        setTimeout(() => error.remove(), 5000);
    }

    _welcomePageTemplate() {
        return `
            <div class="welcome">
                <h1>ChatAI<span class="ver">${this.options.version}</span></h1>                    
                <p>Made with ❤️ by You</p>
                <a href="#" class="open-database"><i class="fa-regular fa-folder-open"></i>Open Database...</a>
            </div>
        `;
    }

    _sidebarTemplate() {
        return `
            <a href="#" class="open-sidebar" title="Open Sidebar"><i class="fa-solid fa-bars"></i></a>
            <nav class="conversations">
                <a class="new-conversation" href="#"><i class="fa-solid fa-plus"></i>New Conversation</a>
                <div class="list"></div>
                <div class="footer">
                    <a class="save" href="#" title="Save"><i class="fa-solid fa-floppy-disk"></i></a>
                    <a class="open-database" href="#"><i class="fa-regular fa-folder-open"></i></a>
                    <a class="settings" href="#"><i class="fa-solid fa-cog"></i></a>
                    <a class="close-sidebar" href="#" title="Close Sidebar"><i class="fa-solid fa-bars"></i></a>
                </div>
            </nav>
        `;
    }

    _eventHandlers() {
        // Handle sending messages
        this.container.querySelector('.message-form').onsubmit = event => {
            event.preventDefault();
            let date = new Date();
            this.selectedConversation.messages.push({
                role: 'user',
                content: this.container.querySelector('.message-form input').value,
                date: date
            });
            this.container.querySelector('.content .messages').insertAdjacentHTML('beforeend', `
                <div class="message assistant active">
                    <div class="wrapper">
                        <div class="avatar">AI</div>
                        <div class="details">
                            <div class="date" data-date="${date}" title="${date}">just now</div>
                            <div class="text"><span class="blink">_</span></div>
                        </div>
                    </div>
                </div>
                <div class="message user">
                    <div class="wrapper">
                        <div class="avatar"><i class="fa-solid fa-user"></i></div>
                        <div class="details">
                            <div class="date" data-date="${date}" title="${date}">just now</div>
                            <div class="text">${this.container.querySelector('.message-form input').value}</div>
                        </div>
                    </div>
                </div>
            `);
            this.container.querySelector('.message-form input').disabled = true;
            this.getMessage();
            this.container.querySelector('.message-form input').value = '';
        };
    }

    get source() {
        return this.options.source;
    }

    set source(value) {
        this.options.source = value;
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

    get maxTokens() {
        return parseInt(this.options.max_tokens);
    }

    set maxTokens(value) {
        this.options.max_tokens = parseInt(value);
    }
}

new ChatAI({
    container: '.chat-ai',
    api_key: '', // Optional if your backend stores keys
    source: 'huggingface'
});
