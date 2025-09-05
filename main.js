document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('send-button');
  const chatInput = document.getElementById('chat-input');
  const messagesContainer = document.querySelector('.messages');
  const apiSelect = document.getElementById('api-select');
  const newConversationButton = document.querySelector('.new-conversation');

  // Utility: Add message to chat
  function addMessage(role, text) {
    const msg = document.createElement('div');
    msg.classList.add('message', role);
    msg.innerHTML = `
      <div class="wrapper">
        <div class="avatar">${role === 'assistant' ? 'AI' : '<i class="fa-solid fa-user"></i>'}</div>
        <div class="details">
          <div class="text">${text}</div>
        </div>
      </div>
    `;
    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Handle Send
  async function handleSend() {
    const text = chatInput.value.trim();
    const service = apiSelect.value;
    if (!text) return;

    addMessage('user', text);
    chatInput.value = '';

    try {
      const res = await fetch(`/api-call/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text })
      });

      const data = await res.json();
      if (data.success) {
        addMessage('assistant', typeof data.result === 'string'
          ? data.result
          : JSON.stringify(data.result, null, 2));
      } else {
        addMessage('assistant', 'Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      addMessage('assistant', 'Request failed.');
      console.error(err);
    }
  }

  sendButton.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  // New conversation resets messages
  newConversationButton.addEventListener('click', (e) => {
    e.preventDefault();
    messagesContainer.innerHTML = '';
    addMessage('assistant', 'Started a new conversation.');
  });
});
