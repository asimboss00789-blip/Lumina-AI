class ChatAI {
    constructor(options = {}) {
        const defaults = {
            container: '.chat-ai',
            version: '1.0',
            available_apis: ['huggingface', 'alpha', 'fmp', 'finnhub', 'groq', 'newsapi'],
            selected_api: 'huggingface',
            conversations: [],
            selected_conversation: null,
            chat_speed: 20,
            show_tokens: false,
            title: document.title
        };

        this.options = Object.assign(defaults, options);
        this.container = document.querySelector(this.options.container);
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
        if (settings) {
            this.options = Object.assign(this.options, settings);
        }

        this._eventHandlers();
        this.container.querySelector('.message-form input').focus();
    }

    // UI templates
    _welcomePageTemplate() {
        return `
            <div class="welcome">
                <h1>ChatAI<span class="ver">${this.options.version}</span></h1>                    
                <p>Made with love by <a href="#">Fallensoul</a></p>
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

    // Send user message and call API
    async getMessage(userMessage) {
        const date = new Date().toISOString();

        // Append user and placeholder bot message
        this.container.querySelector('.content .messages').insertAdjacentHTML('afterbegin', `
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
                        <div class="text">${userMessage}</div>
                    </div>
                </div>
            </div>
        `);

        this.container.querySelector('.message-form input').disabled = true;

        try {
            const response = await fetch(`/api-call/${this.options.selected_api}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: userMessage })
            });

            const data = await response.json();
            let msg = data.result || 'No response from API.';
            let msgEl = this.container.querySelector('.message.assistant.active .text');

            // Simulate typing effect
            let interval = setInterval(() => {
                if (msg[0]) {
                    msgEl.innerHTML += msg[0].replace(/\n/g, '<br>');
                    msg = msg.substring(1);
                } else {
                    clearInterval(interval);
                    this.container.querySelector('.message.assistant.active').classList.remove('active');
                    this.container.querySelector('.message-form input').disabled = false;

                    // Save message in conversation
                    if (this.selectedConversation) {
                        this.selectedConversation.messages.push({ role: 'assistant', content: data.result, date: new Date() });
                    }
                }
                this.container.querySelector('.content .messages').scrollTop = this.container.querySelector('.content .messages').scrollHeight;
            }, this.options.chat_speed);

        } catch (err) {
            this.showErrorMessage('Error connecting to API.');
            console.error(err);
        }
    }

    // Settings
    openSettingsModal() {
        const modal = document.createElement('div');
        modal.classList.add('chat-ai-modal');
        modal.innerHTML = `
            <div class="content">
                <h3 class="heading">Settings<span class="modal-close">&times;</span></h3>
                <div class="body">
                    <form class="settings-form">
                        <label for="source">Source</label>
                        <select name="source" id="source">
                            ${this.options.available_apis.map(api => `<option value="${api}"${this.options.selected_api === api ? ' selected' : ''}>${api}</option>`).join('')}
                        </select>
                        <div class="msg"></div>
                    </form>
                </div>
                <div class="footer">
                    <a href="#" class="btn modal-close save">Save</a>
                    <a href="#" class="btn modal-close reset right alt">Reset</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.onclick = e => {
                e.preventDefault();
                if (btn.classList.contains('save')) {
                    this.options.selected_api = modal.querySelector('#source').value;
                    this.saveSettings();
                }
                if (btn.classList.contains('reset')) {
                    localStorage.removeItem('settings');
                    location.reload();
                }
                modal.remove();
            };
        });

        modal.classList.add('open');
    }

    getSettings() {
        return localStorage.getItem('settings') ? JSON.parse(localStorage.getItem('settings')) : false;
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify({ selected_api: this.options.selected_api }));
    }

    // Event handlers
    _eventHandlers() {
        // Send message
        this.container.querySelector('.message-form button').onclick = e => {
            e.preventDefault();
            const input = this.container.querySelector('.message-form input');
            if (input.value.trim() !== '') this.getMessage(input.value.trim());
            input.value = '';
        };

        this.container.querySelector('.message-form input').addEventListener('keypress', e => {
            if (e.key === 'Enter') this.container.querySelector('.message-form button').click();
        });

        // New conversation
        this.container.querySelector('.new-conversation').onclick = e => {
            e.preventDefault();
            this.createNewConversation();
        };

        // Settings modal
        this.container.querySelector('.settings').onclick = e => {
            e.preventDefault();
            this.openSettingsModal();
        };

        // Update timestamps every 2 min
        setInterval(() => {
            this.container.querySelectorAll('[data-date]').forEach(el => {
                el.innerHTML = this.formatElapsedTime(el.getAttribute('data-date'));
            });
        }, 120000);
    }

    // Conversation management
    createNewConversation(title = null) {
        title = title || 'Conversation ' + (this.conversations.length + 1);
        let index = this.conversations.push({ name: title, messages: [] });
        this.selectedConversationIndex = index - 1;

        const list = this.container.querySelector('.conversations .list');
        list.insertAdjacentHTML('beforeend', `<a class="conversation selected" href="#" data-id="${index - 1}"><i class="fa-regular fa-message"></i>${title}</a>`);
        list.querySelectorAll('a').forEach(a => a.classList.remove('selected'));
        list.lastElementChild.classList.add('selected');

        this.clearMessages();
        this.container.querySelector('.content .messages').innerHTML = `<div class="conversation-title"><h2><span class="text">${title}</span></h2></div>`;
        this.container.querySelector('.message-form input').focus();

        return index - 1;
    }

    // Time formatting
    formatElapsedTime(dateString) {
        let date = new Date(dateString);
        let now = new Date();
        let diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes =
