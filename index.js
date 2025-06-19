const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const pollController = require('./controller/pollController');
const userController = require('./controller/userController');
dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
console.log(MONGO_URI);
// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// CORS configuration for mobile and web access
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Basic middleware to extract user from token (for protected routes)
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'QuickPoll API is running' });
});

// Public poll routes
app.get('/polls/active', pollController.getActivePolls);
app.post('/polls/vote', pollController.votePoll);
app.get('/polls/results', pollController.getResults);

// Admin poll routes
app.get('/polls', pollController.requireAdmin, pollController.getAllPolls);
app.get('/polls/:id', pollController.getPollById);
app.post('/polls/create', pollController.requireAdmin, pollController.createPoll);
app.put('/polls/:id', pollController.requireAdmin, pollController.updatePoll);
app.delete('/polls/:id', pollController.requireAdmin, pollController.deletePoll);

// Public user routes
app.post('/users/register', userController.register);
app.post('/users/login', userController.login);

// Protected user routes
app.get('/users/profile', requireAuth, userController.getProfile);
app.put('/users/profile', requireAuth, userController.updateProfile);

// Admin user routes
app.get('/users', userController.requireAdmin, userController.getAllUsers);
app.get('/users/:id', userController.requireAdmin, userController.getUserById);
app.put('/users/:id', userController.requireAdmin, userController.updateUser);
app.delete('/users/:id', userController.requireAdmin, userController.deleteUser);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation:`);
  console.log(`- Health Check: GET /health`);
  console.log(`- Active Polls: GET /polls/active`);
  console.log(`- Vote: POST /polls/vote`);
  console.log(`- Results: GET /polls/results`);
  console.log(`- Register: POST /users/register`);
  console.log(`- Login: POST /users/login`);
  console.log(`- Admin Routes: /polls, /users (require authentication)`);
});
