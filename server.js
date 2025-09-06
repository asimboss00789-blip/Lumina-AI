const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Debug: Log all environment variables (mask sensitive data)
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
  
  // Basic validation for each API key format
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

// Determine which API to use based on the user's message
function determineAPI(message) {
  const lowerMsg = message.toLowerCase();
  
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
  else if (lowerMsg.includes('news') || lowerMsg.includes('headline') || lowerMsg.includes('article')) {
    return 'newsapi';
  } 
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

  console.log(`📨 Received message: "${userMessage}" -> Using API: ${apiType}`);

  try {
    let responseData;
    
    if (apiType === 'alpha-vantage') {
      if (!process.env.ALPHA_KEY) {
        throw new Error('Alpha Vantage API key not configured');
      }
      
      const symbol = extractStockSymbol(userMessage);
      if (!symbol) {
        responseData = "Please specify a stock symbol, for example: 'What is the price of AAPL?'";
      } else {
        const apiKey = process.env.ALPHA_KEY;
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        
        console.log(`🔍 Calling Alpha Vantage API for symbol: ${symbol}`);
        const response = await axios.get(url, { timeout: 10000 });
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
    } 
    else if (apiType === 'finnhub-crypto') {
      if (!process.env.FINNHUB_KEY) {
        throw new Error('Finnhub API key not configured');
      }
      
      const symbol = extractCryptoSymbol(userMessage);
      if (!symbol) {
        responseData = "Please specify a cryptocurrency, for example: 'What is the price of Bitcoin?'";
      } else {
        const apiKey = process.env.FINNHUB_KEY;
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        
        console.log(`🔍 Calling Finnhub API for crypto: ${symbol}`);
        const response = await axios.get(url, { timeout: 10000 });
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
    } 
    else if (apiType === 'finnhub-news') {
      if (!process.env.FINNHUB_KEY) {
        throw new Error('Finnhub API key not configured');
      }
      
      const apiKey = process.env.FINNHUB_KEY;
      const url = `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`;
      
      console.log('🔍 Calling Finnhub API for news');
      const response = await axios.get(url, { timeout: 10000 });
      const articles = response.data;
      
      if (articles && articles.length > 0) {
        const topArticle = articles[0];
        responseData = `Latest financial news: ${topArticle.headline}. Source: ${topArticle.source}`;
      } else {
        responseData = "Sorry, I couldn't fetch financial news at the moment.";
      }
    } 
    else if (apiType === 'fmp') {
      if (!process.env.FMP_KEY) {
        throw new Error('FMP API key not configured');
      }
      
      const symbol = extractStockSymbol(userMessage);
      if (!symbol) {
        responseData = "Please specify a stock symbol for company information, for example: 'Show me the profile of AAPL'";
      } else {
        const apiKey = process.env.FMP_KEY;
        const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`;
        
        console.log(`🔍 Calling FMP API for company profile: ${symbol}`);
        const response = await axios.get(url, { timeout: 10000 });
        const data = response.data;
        
        if (data && data.length > 0) {
          const company = data[0];
          responseData = `Company: ${company.companyName} (${symbol})\nPrice: $${company.price}\nDescription: ${company.description.substring(0, 200)}...`;
        } else {
          responseData = `Sorry, I couldn't find company data for ${symbol}.`;
        }
      }
    } 
    else if (apiType === 'newsapi') {
      if (!process.env.NEWSAPI_KEY) {
        throw new Error('NewsAPI key not configured');
      }
      
      const apiKey = process.env.NEWSAPI_KEY;
      const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
      
      console.log('🔍 Calling NewsAPI for headlines');
      const response = await axios.get(url, { timeout: 10000 });
      const articles = response.data.articles;
      
      if (articles && articles.length > 0) {
        const topArticle = articles[0];
        responseData = `Top news: ${topArticle.title}. Source: ${topArticle.source.name}`;
      } else {
        responseData = "Sorry, I couldn't fetch news at the moment.";
      }
    } 
    else {
      if (!process.env.GROQ_KEY) {
        throw new Error('Groq API key not configured');
      }
      
      const apiKey = process.env.GROQ_KEY;
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const payload = {
        model: "llama2-70b-4096",
        messages: [{ role: "user", content: userMessage }],
        max_tokens: 1024
      };
      
      console.log('🔍 Calling Groq API for general response');
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      responseData = response.data.choices[0].message.content;
    }
    
    res.json({ response: responseData });
  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      res.status(500).json({ error: 'Invalid API key. Please check your API key configuration.' });
    } else if (error.code === 'ECONNABORTED') {
      res.status(500).json({ error: 'Request timeout. The API service might be slow or unavailable.' });
    } else {
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
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
