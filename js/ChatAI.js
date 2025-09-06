class ChatAI {
    constructor(options) {
        const defaults = {
            container: null,
            api_key: '',
            model: '',
            max_tokens: 500,
            chat_speed: 20,
            messages_limit: 50, // remember last 50 messages
            specialResponses: {}
        };
        this.options = Object.assign(defaults, options);
        this.container = document.querySelector(this.options.container);
        this.userId = this.getUserId();
        this.conversations = this.loadConversations();
        this.initUI();
    }

    getUserId() {
        let id = localStorage.getItem('user_id');
        if (!id) {
            id = 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            localStorage.setItem('user_id', id);
        }
        return id;
    }

    loadConversations() {
        let data = localStorage.getItem('starlink_chats_' + this.userId);
        if (data) return JSON.parse(data);
        return [];
    }

    saveConversations() {
        if (this.conversations.length > this.options.messages_limit) {
            this.conversations = this.conversations.slice(-this.options.messages_limit);
        }
        localStorage.setItem('starlink_chats_' + this.userId, JSON.stringify(this.conversations));
    }

    initUI() {
        this.messagesContainer = this.container.querySelector('.messages');
        this.inputField = this.container.querySelector('#chat-input');
        this.sendButton = this.container.querySelector('#send-button');
        this.voiceButton = this.container.querySelector('#voice-button');

        this.sendButton.addEventListener('click', () => this.handleMessage());
        this.inputField.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.handleMessage();
        });

        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', () => this.startVoiceInput());
        }

        this.renderMessages();
    }

    renderMessages() {
        this.messagesContainer.innerHTML = '';
        this.conversations.forEach(msg => {
            this.appendMessage(msg.content, msg.role);
        });
        this.scrollToBottom();
    }

    appendMessage(message, sender) {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', sender);
        messageEl.innerHTML = `<div class="wrapper"><div class="avatar">${sender === 'bot' ? 'AI' : '<i class="fas fa-user"></i>'}</div><div class="details"><div class="text">${message}</div></div></div>`;
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    handleMessage() {
        const text = this.inputField.value.trim();
        if (!text) return;

        this.appendMessage(text, 'user');
        this.conversations.push({ role: 'user', content: text });
        this.inputField.value = '';
        this.saveConversations();

        // Check special responses first
        const specialAnswer = this.options.specialResponses[text.toLowerCase()];
        if (specialAnswer) {
            this.appendMessage(specialAnswer, 'bot');
            this.conversations.push({ role: 'bot', content: specialAnswer });
            this.saveConversations();
            return;
        }

        // Call all APIs
        this.callAllAPIs(text).then(answer => {
            this.appendMessage(answer, 'bot');
            this.conversations.push({ role: 'bot', content: answer });
            this.saveConversations();
        });
    }

    async callAllAPIs(input) {
        const apis = ['huggingface', 'alpha', 'fmp', 'finnhub', 'groq', 'newsapi'];
        let results = [];
        for (const api of apis) {
            try {
                const res = await fetch(`/api/call/${api}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input })
                });
                const data = await res.json();
                if (data.result) results.push(data.result);
            } catch (e) {
                results.push(`Error in ${api}`);
            }
        }
        // Combine all API responses into one string
        return results.join(' | ');
    }

    startVoiceInput() {
        if (!('webkitSpeechRecognition' in window)) return alert('Voice not supported');
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.start();
        recognition.onresult = event => {
            const transcript = event.results[0][0].transcript;
            this.inputField.value = transcript;
            this.handleMessage();
        };
    }
}

// Initialize
new ChatAI({
    container: '.chat-ai',
    api_key: '',
    model: 'starlink-model',
    max_tokens: 500,
    specialResponses: {
        "who made you": "Fallensoul",
        "who created you": "Fallensoul"
    }
});
