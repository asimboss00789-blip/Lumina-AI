Lumina-AI is a multi-API AI chatbot platform with a web interface. It supports multiple AI and data APIs, conversation storage, prompts, knowledge files, and user management. Designed to run on Node.js with Express, it is ready for Render deployment.

Features include multi-API integration (OpenAI, Hugging Face, Alpha Vantage, FMP, Finnhub, Groq, NewsAPI), a responsive HTML/CSS/JS frontend layout with chat interface and prompts section, and a Node.js + Express backend that handles API requests securely with environment variables.

The platform supports conversation storage with a max of 50 messages per conversation and auto-deletes conversations after 3 days of inactivity. It also includes an optional login system with anonymous IDs and JSON-based data storage for users, conversations, books, and prompts. Knowledge file support allows the AI to access additional context from the books folder.

Project structure includes: assets (images and icons), books (knowledge files), config.json (AI/chat configuration), conversations (stored conversation JSON files), css (stylesheets), js (frontend scripts), logs (server activity logs), pages (optional frontend pages), prompts.json (predefined AI prompts), users (user data), index.html (main frontend file), package.json (Node.js dependencies and scripts), server.js (main backend server), and README.md (this file).

To get started locally, clone the repository with git clone https://github.com/YOUR_USERNAME/Lumina-AI.git and navigate into the directory. Install dependencies with npm install. Add your environment variables in a .env file including OPENAI_KEY, HUGGINGFACE_KEY, ALPHA_KEY, FMP_KEY, FINNHUB_KEY, GROQ_KEY, and NEWSAPI_KEY. Run the server locally with npm start and open index.html in your browser or visit http://localhost:PORT (default port 3000).

To deploy on Render, fork or push your repository to GitHub, log in to Render, create a new web service, and connect your GitHub repository. Set build/start commands (npm install for build and npm start for start), add your API keys in Render’s environment variables settings, and deploy.

Usage includes chatting with the AI via connected APIs, utilizing predefined prompts, storing conversations with auto-delete after inactivity, and accessing additional knowledge files in the books folder.

Notes: always keep API keys private, maximum 50 messages per conversation (older messages auto-deleted), anonymous IDs allow non-logged-in users to maintain temporary sessions, and the logs folder contains server activity for debugging purposes.
