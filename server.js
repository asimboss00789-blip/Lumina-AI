const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Debug: Log environment variables
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ALPHA_KEY present:', !!process.env.ALPHA_KEY);
console.log('FMP_KEY present:', !!process.env.FMP_KEY);
console.log('FINNHUB_KEY present:', !!process.env.FINNHUB_KEY);
console.log('GROQ_KEY present:', !!process.env.GROQ_KEY);
console.log('HUGGINGFACE_KEY present:', !!process.env.HUGGINGFACE_KEY);
console.log('NEWSAPI_KEY present:', !!process.env.NEWSAPI_KEY);
console.log('=============================');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Key validation
function validateApiKey(apiName, apiKey) {
  if (!apiKey) {
    console.error(`❌ ${apiName} API key is missing`);
    return false;
  }
  
  switch(apiName) {
    case 'Alpha Vantage':
      if (apiKey.length !== 16) console.warn(`⚠️ Alpha Vantage key should be 16 chars, got ${apiKey.length}`);
      break;
    case 'Groq':
      if (!apiKey.startsWith('gsk_')) console.warn(`⚠️ Groq key should start with 'gsk_', got ${apiKey.substring(0, 4)}`);
      break;
    case 'Hugging Face':
      if (!apiKey.startsWith('hf_')) console.warn(`⚠️ Hugging Face key should start with 'hf_', got ${apiKey.substring(0, 3)}`);
      break;
    case 'NewsAPI':
      if (apiKey.length !== 32) console.warn(`⚠️ NewsAPI key should be 32 chars, got ${apiKey.length}`);
      break;
  }
  
  console.log(`✅ ${apiName} API key is present`);
  return true;
}

// Validate all API keys on startup
console.log('\n=== API KEY VALIDATION ===');
const apiKeys = {
  'Alpha Vantage': process.env.ALPHA_KEY,
  'FMP': process.env.FMP_KEY,
  'Finnhub': process.env.FINNHUB_KEY,
  'Groq': process.env.GROQ_KEY,
  'Hugging Face': process.env.HUGGINGFACE_KEY,
  'NewsAPI': process.env.NEWSAPI_KEY
};

Object.entries(apiKeys).forEach(([name, key]) => validateApiKey(name, key));
console.log('==========================\n');

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

// API endpoint for chat - Now uses multiple APIs
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  console.log(`📨 Received message: "${userMessage}"`);

  try {
    // Array to store all API responses
    const apiResponses = [];
    const symbol = extractStockSymbol(userMessage);
    const cryptoSymbol = extractCryptoSymbol(userMessage);
    const lowerMsg = userMessage.toLowerCase();

    // Call all relevant APIs in parallel
    const apiPromises = [];

    // 1. Alpha Vantage (for stocks)
    if (process.env.ALPHA_KEY && symbol) {
      apiPromises.push(
        axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_KEY}`, { timeout: 10000 })
          .then(response => {
            if (response.data['Global Quote'] && response.data['Global Quote']['05. price']) {
              const price = response.data['Global Quote']['05. price'];
              const change = response.data['Global Quote']['09. change'];
              const changePercent = response.data['Global Quote']['10. change percent'];
              apiResponses.push(`Alpha Vantage: The current price of ${symbol} is $${price} (${change}, ${changePercent}).`);
            }
          })
          .catch(error => {
            console.error('Alpha Vantage error:', error.message);
          })
      );
    }

    // 2. Finnhub (for stocks and crypto)
    if (process.env.FINNHUB_KEY) {
      if (symbol) {
        apiPromises.push(
          axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_KEY}`, { timeout: 10000 })
            .then(response => {
              if (response.data.c) {
                const price = response.data.c;
                const change = response.data.d;
                const changePercent = response.data.dp;
                apiResponses.push(`Finnhub: The current price of ${symbol} is $${price} (${change}, ${changePercent}%).`);
              }
            })
            .catch(error => {
              console.error('Finnhub stock error:', error.message);
            })
        );
      }

      if (cryptoSymbol) {
        apiPromises.push(
          axios.get(`https://finnhub.io/api/v1/quote?symbol=${cryptoSymbol}&token=${process.env.FINNHUB_KEY}`, { timeout: 10000 })
            .then(response => {
              if (response.data.c) {
                const price = response.data.c;
                const change = response.data.d;
                const changePercent = response.data.dp;
                const cryptoName = cryptoSymbol.split(':')[0];
                apiResponses.push(`Finnhub: The current price of ${cryptoName} is $${price} (${change}, ${changePercent}%).`);
              }
            })
            .catch(error => {
              console.error('Finnhub crypto error:', error.message);
            })
        );
      }

      // Finnhub news
      apiPromises.push(
        axios.get(`https://finnhub.io/api/v1/news?category=general&token=${process.env.FINNHUB_KEY}`, { timeout: 10000 })
          .then(response => {
            if (response.data && response.data.length > 0) {
              const topArticle = response.data[0];
              apiResponses.push(`Finnhub News: ${topArticle.headline}. Source: ${topArticle.source}`);
            }
          })
          .catch(error => {
            console.error('Finnhub news error:', error.message);
          })
      );
    }

    // 3. FMP (for company profiles)
    if (process.env.FMP_KEY && symbol) {
      apiPromises.push(
        axios.get(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${process.env.FMP_KEY}`, { timeout: 10000 })
          .then(response => {
            if (response.data && response.data.length > 0) {
              const company = response.data[0];
              apiResponses.push(`FMP: ${company.companyName} (${symbol}) - Price: $${company.price}. ${company.description.substring(0, 100)}...`);
            }
          })
          .catch(error => {
            console.error('FMP error:', error.message);
          })
      );
    }

    // 4. NewsAPI (for general news)
    if (process.env.NEWSAPI_KEY) {
      apiPromises.push(
        axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEWSAPI_KEY}`, { timeout: 10000 })
          .then(response => {
            if (response.data.articles && response.data.articles.length > 0) {
              const topArticle = response.data.articles[0];
              apiResponses.push(`NewsAPI: Top news - ${topArticle.title}. Source: ${topArticle.source.name}`);
            }
          })
          .catch(error => {
            console.error('NewsAPI error:', error.message);
          })
      );
    }

    // 5. Groq (for general AI response) - Using correct model
    if (process.env.GROQ_KEY) {
      apiPromises.push(
        axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: "mixtral-8x7b-32768", // Fixed model name
          messages: [{ role: "user", content: userMessage }],
          max_tokens: 1024
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        })
          .then(response => {
            apiResponses.push(`Groq AI: ${response.data.choices[0].message.content}`);
          })
          .catch(error => {
            console.error('Groq error:', error.message);
          })
      );
    }

    // 6. Hugging Face (for alternative AI response)
    if (process.env.HUGGINGFACE_KEY) {
      apiPromises.push(
        axios.post('https://api-inference.huggingface.co/models/google/flan-t5-xxl', {
          inputs: userMessage
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        })
          .then(response => {
            if (response.data && response.data[0] && response.data[0].generated_text) {
              apiResponses.push(`Hugging Face: ${response.data[0].generated_text}`);
            }
          })
          .catch(error => {
            console.error('Hugging Face error:', error.message);
          })
      );
    }

    // Wait for all API calls to complete
    await Promise.allSettled(apiPromises);

    // Combine all responses into a single message
    let combinedResponse = "I've gathered information from multiple sources:\n\n";
    
    if (apiResponses.length > 0) {
      apiResponses.forEach((response, index) => {
        combinedResponse += `${index + 1}. ${response}\n\n`;
      });
    } else {
      combinedResponse = "Sorry, I couldn't retrieve any information from the APIs. Please try again later.";
    }

    res.json({ response: combinedResponse });
  } catch (error) {
    console.error('Overall API error:', error.message);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Lumina AI server is running',
    apis: {
      alpha_vantage: !!process.env.ALPHA_KEY,
      fmp: !!process.env.FMP_KEY,
      finnhub: !!process.env.FINNHUB_KEY,
      groq: !!process.env.GROQ_KEY,
      huggingface: !!process.env.HUGGINGFACE_KEY,
      newsapi: !!process.env.NEWSAPI_KEY
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Lumina AI server running on port ${port}`);
});
