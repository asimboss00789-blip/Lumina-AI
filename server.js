const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Load configuration from config.json
let config = {};
try {
  config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  console.log('Configuration loaded successfully');
} catch (error) {
  console.error('Error loading config.json, using default settings:', error.message);
  // Default configuration if config.json is missing or invalid
  config = {
    app: {
      name: "Lumina AI",
      version: "1.0.0"
    },
    apiSettings: {
      timeout: 10000,
      retryAttempts: 3
    },
    chatSettings: {
      maxMessageLength: 1000,
      messageHistoryLimit: 50
    }
  };
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Determine which API to use based on the user's message
function determineAPI(message) {
  const lowerMsg = message.toLowerCase();
  
  // Financial data queries
  if (lowerMsg.includes('stock') || lowerMsg.includes('price') || lowerMsg.includes('finance') || 
      lowerMsg.includes('market') || lowerMsg.includes('investment')) {
    
    if (lowerMsg.includes('news') || lowerMsg.includes('headline')) {
      return 'finnhub-news';
    } else if (lowerMsg.includes('crypto') || lowerMsg.includes('bitcoin') || lowerMsg.includes('ethereum')) {
      return 'finnhub-crypto';
    } else if (lowerMsg.includes('profile') || lowerMsg.includes('company') || 
               lowerMsg.includes('balance') || lowerMsg.includes('income')) {
      return 'fmp';
    } else {
      return 'alpha-vantage';
    }
  } 
  // News queries
  else if (lowerMsg.includes('news') || lowerMsg.includes('headline') || lowerMsg.includes('article')) {
    return 'newsapi';
  } 
  // General knowledge queries
  else {
    return 'groq';
  }
}

// Extract stock symbol from message
function extractStockSymbol(message) {
  const words = message.split(' ');
  const symbol = words.find(word => word.match(/^[A-Z]{1,5}$/));
  return symbol || null;
}

// Extract cryptocurrency symbol from message
function extractCryptoSymbol(message) {
  const cryptoKeywords = {
    'bitcoin': 'BINANCE:BTCUSDT',
    'btc': 'BINANCE:BTCUSDT',
    'ethereum': 'BINANCE:ETHUSDT',
    'eth': 'BINANCE:ETHUSDT',
    'cardano': 'BINANCE:ADAUSDT',
    'ada': 'BINANCE:ADAUSDT',
    'solana': 'BINANCE:SOLUSDT',
    'sol': 'BINANCE:SOLUSDT',
    'ripple': 'BINANCE:XRPUSDT',
    'xrp': 'BINANCE:XRPUSDT'
  };
  
  const lowerMsg = message.toLowerCase();
  for (const [key, value] of Object.entries(cryptoKeywords)) {
    if (lowerMsg.includes(key)) {
      return value;
    }
  }
  return null;
}

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  const apiType = determineAPI(userMessage);

  try {
    let responseData;
    
    if (apiType === 'alpha-vantage') {
      // Use Alpha Vantage for stock data
      const symbol = extractStockSymbol(userMessage);
      if (!symbol) {
        responseData = "Please specify a stock symbol, for example: 'What is the price of AAPL?'";
      } else {
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        const response = await axios.get(url, { timeout: config.apiSettings.timeout });
        const data = response.data;
        
        if (data['Global Quote'] && data['Global Quote']['05. price']) {
          const price = data['Global Quote']['05. price'];
          const change = data['Global Quote']['09. change'];
          const changePercent = data['Global Quote']['10. change percent'];
          responseData = `The current price of ${symbol} is $${price} (${change}, ${changePercent}).`;
        } else {
          responseData = `Sorry, I couldn't find data for ${symbol}. Please check the symbol and try again.`;
        }
      }
    } else if (apiType === 'finnhub-crypto') {
      // Use Finnhub for crypto data
      const symbol = extractCryptoSymbol(userMessage);
      if (!symbol) {
        responseData = "Please specify a cryptocurrency, for example: 'What is the price of Bitcoin?'";
      } else {
        const apiKey = process.env.FINNHUB_API_KEY;
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        const response = await axios.get(url, { timeout: config.apiSettings.timeout });
        const data = response.data;
        
        if (data.c) {
          const price = data.c;
          const change = data.d;
          const changePercent = data.dp;
          const cryptoName = symbol.split(':')[0];
          responseData = `The current price of ${cryptoName} is $${price} (${change}, ${changePercent}%).`;
        } else {
          responseData = `Sorry, I couldn't find data for ${symbol}. Please try again.`;
        }
      }
    } else if (apiType === 'finnhub-news') {
      // Use Finnhub for financial news
      const apiKey = process.env.FINNHUB_API_KEY;
      const url = `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`;
      const response = await axios.get(url, { timeout: config.apiSettings.timeout });
      const articles = response.data;
      
      if (articles && articles.length > 0) {
        const topArticle = articles[0];
        responseData = `Latest financial news: ${topArticle.headline}. Source: ${topArticle.source}`;
      } else {
        responseData = "Sorry, I couldn't fetch financial news at the moment.";
      }
    } else if (apiType === 'fmp') {
      // Use Financial Modeling Prep for company data
      const symbol = extractStockSymbol(userMessage);
      if (!symbol) {
        responseData = "Please specify a stock symbol for company information, for example: 'Show me the profile of AAPL'";
      } else {
        const apiKey = process.env.FMP_API_KEY;
        const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`;
        const response = await axios.get(url, { timeout: config.apiSettings.timeout });
        const data = response.data;
        
        if (data && data.length > 0) {
          const company = data[0];
          responseData = `Company: ${company.companyName} (${symbol})\nPrice: $${company.price}\nDescription: ${company.description.substring(0, 200)}...`;
        } else {
          responseData = `Sorry, I couldn't find company data for ${symbol}.`;
        }
      }
    } else if (apiType === 'newsapi') {
      // Use NewsAPI for general news
      const apiKey = process.env.NEWSAPI_KEY;
      const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
      const response = await axios.get(url, { timeout: config.apiSettings.timeout });
      const articles = response.data.articles;
      
      if (articles && articles.length > 0) {
        const topArticle = articles[0];
        responseData = `Top news: ${topArticle.title}. Source: ${topArticle.source.name}`;
      } else {
        responseData = "Sorry, I couldn't fetch news at the moment.";
      }
    } else {
      // Use Groq for general AI responses
      const groqApiKey = process.env.GROQ_API_KEY;
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const payload = {
        model: "llama2-70b-4096",
        messages: [{ role: "user", content: userMessage }],
        max_tokens: 1024
      };
      
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: config.apiSettings.timeout
      });
      
      responseData = response.data.choices[0].message.content;
    }
    
    res.json({ response: responseData });
  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Lumina AI server is running',
    config: config.app
  });
});

// Get app configuration
app.get('/api/config', (req, res) => {
  res.json(config);
});

// Start the server
app.listen(port, () => {
  console.log(`${config.app.name} server running on port ${port}`);
});
