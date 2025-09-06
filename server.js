const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file (optional, since Render has env vars)

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());
// Serve static files (e.g., index.html, css, js)
app.use(express.static(path.join(__dirname)));

// Determine which API to use based on the user's message
function determineAPI(message) {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('stock') || lowerMsg.includes('price') || lowerMsg.includes('finance') || lowerMsg.includes('market')) {
        return 'alpha_vantage'; // Can be changed to Finnhub or FMP
    } else if (lowerMsg.includes('news')) {
        return 'newsapi';
    } else {
        return 'groq'; // Use Groq for general AI responses (can switch to Hugging Face if preferred)
    }
}

// Extract stock symbol from message (simple implementation)
function extractStockSymbol(message) {
    const words = message.split(' ');
    const symbol = words.find(word => word.match(/^[A-Z]{1,5}$/)); // Matches uppercase words like AAPL
    return symbol || null;
}

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    const apiType = determineAPI(userMessage);

    try {
        let responseData;
        if (apiType === 'alpha_vantage') {
            // Use Alpha Vantage for stock data
            const symbol = extractStockSymbol(userMessage);
            if (!symbol) {
                responseData = "Please specify a stock symbol, for example: 'What is the price of AAPL?'";
            } else {
                const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
                const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
                const response = await axios.get(url);
                const data = response.data;
                if (data['Global Quote']) {
                    const price = data['Global Quote']['05. price'];
                    responseData = `The current price of ${symbol} is $${price}.`;
                } else {
                    responseData = `Sorry, I couldn't find data for ${symbol}. Please check the symbol and try again.`;
                }
            }
        } else if (apiType === 'newsapi') {
            // Use NewsAPI for news
            const apiKey = process.env.NEWSAPI_KEY;
            const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
            const response = await axios.get(url);
            const articles = response.data.articles;
            if (articles && articles.length > 0) {
                // Return the top headline
                const headline = articles[0].title;
                responseData = `Top news headline: ${headline}`;
            } else {
                responseData = "Sorry, no news headlines found at the moment.";
            }
        } else {
            // Use Groq for general AI responses
            const groqApiKey = process.env.GROQ_API_KEY;
            const url = 'https://api.groq.com/openai/v1/chat/completions';
            const payload = {
                model: "llama2-70b-4096", // Adjust model as needed
                messages: [{ role: "user", content: userMessage }],
                max_tokens: 1024
            };
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            responseData = response.data.choices[0].message.content;
        }
        res.json({ response: responseData });
    } catch (error) {
        console.error('API error:', error.response?.data || error.message);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
