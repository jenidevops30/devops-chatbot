const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initDB, pool } = require('./db');
const authMiddleware = require('./middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database
initDB();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyBpBR3czMZv834NRDkygW2o-v0GxaUUMw8');

// Security middleware
app.use(helmet());
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://devops.it.cyou',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id']
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 8);
    await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username,
        messageCount: user.message_count || 0 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, message_count FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        messageCount: user.message_count || 0 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.get('/api/auth/guest/:guestId', async (req, res) => {
  const { guestId } = req.params;
  try {
    const [rows] = await pool.query('SELECT message_count FROM guest_usage WHERE guest_id = ?', [guestId]);
    if (rows.length === 0) {
      await pool.query('INSERT INTO guest_usage (guest_id, message_count) VALUES (?, 0)', [guestId]);
      return res.json({ messageCount: 0 });
    }
    res.json({ messageCount: rows[0].message_count });
  } catch (error) {
    console.error('Guest status fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch guest status' });
  }
});

const DEVOPS_SYSTEM_PROMPT = `You are DevOps Assistant, an expert AI specializing in DevOps, platform engineering, and SRE.

Guidelines:
- ALWAYS ask for missing details before providing a full solution. If a request is vague, ask about:
  - The specific environment (Cloud, On-prem, OS)
  - Tool versions (e.g., Kubernetes version, Terraform version)
  - The exact error messages or terminal output
  - The desired goal or architecture
- Once details are clear, provide working code examples with proper syntax
- Use markdown code blocks with language tags (yaml, bash, dockerfile, hcl, json)
- Explain WHY not just HOW — include best practices
- Mention security considerations when relevant
- Keep responses focused and practical`;

// Gemini Chat Function
async function callGemini(messages, history, modelName) {
  const preferredModel = modelName || process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
  
  const attemptCall = async (mName) => {
    const model = genAI.getGenerativeModel({ model: mName });
    const chatHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: { parts: [{ text: DEVOPS_SYSTEM_PROMPT }] },
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const response = await result.response;
    return response.text();
  };

  try {
    return await attemptCall(preferredModel);
  } catch (err) {
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      throw new Error(`${preferredModel} limit over. Please wait or switch to Ollama in the bottom controls.`);
    }
    console.error(`Gemini Error (${preferredModel}):`, err.message);
    throw new Error(`${preferredModel} is currently under maintenance or unavailable. Please switch to Gemini 2 or Ollama in the bottom controls.`);
  }
}

// Ollama Chat Function
async function callOllama(messages, history, modelName) {
  const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';
  const OLLAMA_MODEL = modelName || process.env.OLLAMA_MODEL || 'llama3';

  const ollamaMessages = [
    { role: 'system', content: DEVOPS_SYSTEM_PROMPT },
    ...history.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: messages[messages.length - 1].content }
  ];

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages: ollamaMessages, stream: false })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (err) {
    console.error(`[Ollama Error] Failed connect to ${OLLAMA_HOST}:`, err.message);
    throw new Error(`Failed to call Ollama: ${err.message}. Check if OLLAMA_HOST=0.0.0.0 is set on host.`);
  }
}

// Endpoint to fetch Ollama models
app.get('/api/models/ollama', async (req, res) => {
  const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (!response.ok) throw new Error(`Ollama host ${OLLAMA_HOST} unreachable`);
    const data = await response.json();
    res.json(data.models || []);
  } catch (err) {
    console.error(`[Model Discovery] Failed to reach Ollama at ${OLLAMA_HOST}:`, err.message);
    res.status(503).json({ error: 'Ollama service offline', details: err.message });
  }
});

// Conversation management endpoints
// Conversation management endpoints
app.get('/api/conversations', authMiddleware, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const [rows] = await pool.query(
      'SELECT id, title, created_at FROM conversations WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.post('/api/conversations', authMiddleware, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  const { title = 'New Chat' } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
      [req.user.id, title]
    );
    res.json({ id: result.insertId, title });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const [rows] = await pool.query(
      'SELECT role, content, timestamp FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Chat endpoint (Protected/Optional Auth)
app.post('/api/chat', authMiddleware, async (req, res) => {
  const { messages, conversationHistory = [], provider = 'gemini' } = req.body;
  const guestId = req.header('x-guest-id');
  const MAX_FREE_MESSAGES = parseInt(process.env.MAX_FREE_MESSAGES || '10');

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    let currentCount = 0;
    let userId = null;

    if (req.user) {
      userId = req.user.id;
      const [userRows] = await pool.query('SELECT message_count FROM users WHERE id = ?', [userId]);
      currentCount = userRows[0]?.message_count || 0;
    } else if (guestId) {
      const [guestRows] = await pool.query('SELECT message_count FROM guest_usage WHERE guest_id = ?', [guestId]);
      if (guestRows.length === 0) {
        await pool.query('INSERT INTO guest_usage (guest_id, message_count) VALUES (?, 0)', [guestId]);
        currentCount = 0;
      } else {
        currentCount = guestRows[0].message_count;
      }
    } else {
      return res.status(401).json({ error: 'Authentication or Guest ID required' });
    }

    if (currentCount >= MAX_FREE_MESSAGES) {
      return res.status(403).json({ 
        error: 'Free tier limit reached', 
        details: `You have used all ${MAX_FREE_MESSAGES} free chats. Please log in or register to continue.` 
      });
    }

    // 2. Format history
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // 3. Call AI Provider
    let text;
    if (provider === 'ollama') {
      text = await callOllama(messages, history, req.body.model);
    } else {
      text = await callGemini(messages, history, req.body.model);
    }

    // 4. Persistence and accounting
    let finalConversationId = req.body.conversationId;

    if (userId) {
      await pool.query('UPDATE users SET message_count = message_count + 1 WHERE id = ?', [userId]);

      if (!finalConversationId) {
        const [convResult] = await pool.query(
          'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
          [userId, messages[0].content.substring(0, 30) + '...']
        );
        finalConversationId = convResult.insertId;
      }

      await pool.query(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, "user", ?)',
        [finalConversationId, messages[messages.length - 1].content]
      );

      await pool.query(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, "assistant", ?)',
        [finalConversationId, text]
      );
    } else {
      await pool.query('UPDATE guest_usage SET message_count = message_count + 1 WHERE guest_id = ?', [guestId]);
    }

    res.json({
      message: text,
      conversationId: finalConversationId,
      usage: {
        messageCount: currentCount + 1,
        isGuest: !userId,
        provider
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.listen(PORT, () => {
  console.log(`DevOps Chatbot backend running on port ${PORT}`);
});

module.exports = app;
