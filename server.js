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

// API response cache
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

// API status tracking
const apiStatus = {
  alpha: { available: true, lastError: null },
  fmp: { available: true, lastError: null },
  finnhub: { available: true, lastError: null },
  groq: { available: true, lastError: null },
  huggingface: { available: true, lastError: null },
  newsapi: { available: true, lastError: null }
};

// Extract stock symbol from message
function extractStockSymbol(message) {
  const words = message.split(' ');
  const symbol = words.find(word => word.match(/^[A-Z]{1,5}$/));
  return symbol || null;
}

// Extract cryptocurrency symbol from message
function extractCryptoSymbol(message) {
  const cryptoKeywords = {
    'bitcoin': 'BINANCE:BTCUSDT', 'btc': 'BINANCE:BTCUSDT',
    'ethereum': 'BINANCE:ETHUSDT', 'eth': 'BINANCE:ETHUSDT',
    'cardano': 'BINANCE:ADAUSDT', 'ada': 'BINANCE:ADAUSDT',
    'solana': 'BINANCE:SOLUSDT', 'sol': 'BINANCE:SOLUSDT',
    'ripple': 'BINANCE:XRPUSDT', 'xrp': 'BINANCE:XRPUSDT'
  };
  
  const lowerMsg = message.toLowerCase();
  for (const [key, value] of Object.entries(cryptoKeywords)) {
    if (lowerMsg.includes(key)) return value;
  }
  return null;
}

// Extract keywords for news search
function extractKeywords(message) {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'what', 'how', 'why', 
                            'when', 'where', 'i', 'you', 'we', 'they', 'this', 
                            'that', 'these', 'those', 'can', 'could', 'will', 'would']);
  
  return message
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 3 && !stopWords.has(word))
    .join(' ') || 'technology'; // Default keyword if none found
}

// API call with error handling and caching
async function callAPI(apiName, callFunction, cacheKey = null) {
  if (!apiStatus[apiName].available) {
    console.log(`Skipping ${apiName} API (marked as unavailable)`);
    return null;
  }
  
  if (cacheKey && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached response for ${apiName}`);
      return cached.data;
    }
  }
  
  try {
    const result = await callFunction();
    apiStatus[apiName].available = true;
    apiStatus[apiName].lastError = null;
    
    if (cacheKey) {
      apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }
    
    return result;
  } catch (error) {
    console.error(`${apiName} API error:`, error.response?.data || error.message);
    apiStatus[apiName].lastError = error.response?.data || error.message;
    
    // Handle different error types
    if (error.response) {
      if (error.response.status === 429) { // Rate limit
        console.log(`${apiName} API rate limited. Marking as unavailable.`);
        apiStatus[apiName].available = false;
        setTimeout(() => {
          apiStatus[apiName].available = true;
          console.log(`${apiName} API reactivated after rate limit cooldown`);
        }, 60 * 60 * 1000);
      }
      else if (error.response.status === 403) { // Authentication error
        console.log(`${apiName} API authentication failed. Check API key.`);
        apiStatus[apiName].available = false;
      }
      else if (error.response.status === 400) { // Bad request
        console.log(`${apiName} API bad request. Check parameters.`);
        // Don't disable for bad requests, just log
      }
    }
    
    return null;
  }
}

// Local response synthesis when Groq is unavailable
function synthesizeResponse(userMessage, apiResults) {
  if (apiResults.length === 0) {
    return "I apologize, but I'm currently unable to access my information sources. Please try again later or ask a different question.";
  }
  
  // Simple synthesis logic
  let response = "Based on the information I've gathered: ";
  
  const financialInfo = apiResults.filter(r => r.includes('Stock') || r.includes('Price') || r.includes('Crypto'));
  const newsInfo = apiResults.filter(r => r.includes('News') || r.includes('Financial News'));
  
  if (financialInfo.length > 0) {
    response += financialInfo.join(' ') + " ";
  }
  
  if (newsInfo.length > 0) {
    response += "In recent news: " + newsInfo.map(n => n.replace(/.*News.*?:/, '')).join(' ') + " ";
  }
  
  response += "Is there anything specific you'd like to know more about?";
  
  return response;
}

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  console.log(`📨 Received message: "${userMessage}"`);

  try {
    const symbol = extractStockSymbol(userMessage);
    const cryptoSymbol = extractCryptoSymbol(userMessage);
    const keywords = extractKeywords(userMessage);
    
    const apiResponses = [];
    const apiCalls = [];
    
    // 1. Alpha Vantage (for stocks)
    if (process.env.ALPHA_KEY && symbol) {
      apiCalls.push(
        callAPI('alpha', async () => {
          const response = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_KEY}`,
            { timeout: 10000 }
          );
          
          if (response.data['Global Quote'] && response.data['Global Quote']['05. price']) {
            const price = response.data['Global Quote']['05. price'];
            const change = response.data['Global Quote']['09. change'];
            const changePercent = response.data['Global Quote']['10. change percent'];
            return `Stock Price: ${symbol} is currently at $${price} (change: ${change}, ${changePercent}).`;
          }
          return null;
        }, `alpha_${symbol}`)
      );
    }
    
    // 2. Finnhub (for stocks and crypto)
    if (process.env.FINNHUB_KEY) {
      if (symbol) {
        apiCalls.push(
          callAPI('finnhub', async () => {
            const response = await axios.get(
              `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_KEY}`,
              { timeout: 10000 }
            );
            
            if (response.data.c) {
              const price = response.data.c;
              const change = response.data.d;
              const changePercent = response.data.dp;
              return `Stock Data: ${symbol} trading at $${price} (${changePercent}% change).`;
            }
            return null;
          }, `finnhub_stock_${symbol}`)
        );
      }
      
      if (cryptoSymbol) {
        apiCalls.push(
          callAPI('finnhub', async () => {
            const response = await axios.get(
              `https://finnhub.io/api/v1/quote?symbol=${cryptoSymbol}&token=${process.env.FINNHUB_KEY}`,
              { timeout: 10000 }
            );
            
            if (response.data.c) {
              const price = response.data.c;
              const change = response.data.d;
              const changePercent = response.data.dp;
              const cryptoName = cryptoSymbol.split(':')[0];
              return `Crypto Price: ${cryptoName} at $${price} (${changePercent}% change).`;
            }
            return null;
          }, `finnhub_crypto_${cryptoSymbol}`)
        );
      }
    }
    
    // 3. FMP (for company profiles)
    if (process.env.FMP_KEY && symbol) {
      apiCalls.push(
        callAPI('fmp', async () => {
          const response = await axios.get(
            `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${process.env.FMP_KEY}`,
            { timeout: 10000 }
          );
          
          if (response.data && response.data.length > 0) {
            const company = response.data[0];
            return `Company Info: ${company.companyName} - ${company.description?.substring(0, 100)}...`;
          }
          return null;
        }, `fmp_${symbol}`)
      );
    }
    
    // 4. NewsAPI (for general news)
    if (process.env.NEWSAPI_KEY) {
      apiCalls.push(
        callAPI('newsapi', async () => {
          // Use a more specific query based on user message
          const query = keywords || 'latest news';
          const response = await axios.get(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=3&apiKey=${process.env.NEWSAPI_KEY}`,
            { timeout: 10000 }
          );
          
          if (response.data.articles && response.data.articles.length > 0) {
            // Get the most relevant article (not just the first one)
            const article = response.data.articles[0];
            return `News Update: ${article.title}.`;
          }
          return null;
        }, `newsapi_${keywords}`, 30000)
      );
    }
    
    // 5. Groq (for AI analysis) - with better error handling
    if (process.env.GROQ_KEY) {
      apiCalls.push(
        callAPI('groq', async () => {
          try {
            const response = await axios.post(
              'https://api.groq.com/openai/v1/chat/completions',
              {
                model: "llama-3.1-8b-instant", // More reliable model
                messages: [
                  {
                    role: "system",
                    content: "You are a helpful AI assistant that provides concise and informative responses."
                  },
                  {
                    role: "user",
                    content: userMessage
                  }
                ],
                max_tokens: 800,
                temperature: 0.7
              },
              {
                headers: {
                  'Authorization': `Bearer ${process.env.GROQ_KEY}`,
                  'Content-Type': 'application/json'
                },
                timeout: 15000
              }
            );
            
            return response.data.choices[0].message.content;
          } catch (error) {
            console.error('Groq API detailed error:', error.response?.data);
            throw error;
          }
        }, `groq_${userMessage}`, 60000)
      );
    }
    
    // 6. Hugging Face - with better model selection
    if (process.env.HUGGINGFACE_KEY) {
      apiCalls.push(
        callAPI('huggingface', async () => {
          try {
            // Try a more commonly available model
            const response = await axios.post(
              'https://api-inference.huggingface.co/models/google/flan-t5-large',
              {
                inputs: userMessage
              },
              {
                headers: {
                  'Authorization': `Bearer ${process.env.HUGGINGFACE_KEY}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              }
            );
            
            if (response.data && response.data[0] && response.data[0].generated_text) {
              return response.data[0].generated_text;
            }
            return null;
          } catch (error) {
            console.error('Hugging Face detailed error:', error.response?.data);
            throw error;
          }
        }, `hf_${userMessage}`)
      );
    }
    
    // Execute all API calls
    const results = await Promise.all(apiCalls);
    const validResults = results.filter(result => result !== null);
    
    // Generate final response
    let finalResponse;
    
    if (validResults.length === 0) {
      finalResponse = "I apologize, but I'm currently unable to access my information sources. Please try again later.";
    } else {
      // Try to use Groq response if available
      const groqResult = validResults.find(r => typeof r === 'string' && r.length > 20);
      
      if (groqResult) {
        finalResponse = groqResult;
      } else {
        // Local synthesis if Groq is not available
        finalResponse = synthesizeResponse(userMessage, validResults);
      }
    }
    
    res.json({ response: finalResponse });
    
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
    },
    api_status: apiStatus
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Lumina AI server running on port ${port}`);
});
