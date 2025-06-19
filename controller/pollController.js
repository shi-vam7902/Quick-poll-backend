const pollModel = require('../model/pollModel');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Get all polls (admin only)
async function getAllPolls(req, res) {
  try {
    const polls = await pollModel.getAllPolls();
    res.json(polls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
}

// Get active polls (public)
async function getActivePolls(req, res) {
  try {
    const polls = await pollModel.getActivePolls();
    res.json(polls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active polls' });
  }
}

// Get poll by ID
async function getPollById(req, res) {
  try {
    const { id } = req.params;
    const poll = await pollModel.getPollById(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    res.json(poll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
}

// Create poll (admin only)
async function createPoll(req, res) {
  try {
    const { question, options } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Invalid poll data. Question and at least 2 options required.' });
    }
    const poll = await pollModel.createPoll(question, options);
    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create poll' });
  }
}

// Update poll (admin only)
async function updatePoll(req, res) {
  try {
    const { id } = req.params;
    const { question, options, active } = req.body;
    
    const poll = await pollModel.getPollById(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const updatedPoll = await pollModel.updatePoll(id, { question, options, active });
    res.json(updatedPoll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update poll' });
  }
}

// Delete poll (admin only)
async function deletePoll(req, res) {
  try {
    const { id } = req.params;
    const poll = await pollModel.getPollById(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    await pollModel.deletePoll(id);
    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete poll' });
  }
}

// Vote on poll
async function votePoll(req, res) {
  try {
    const { pollId, option } = req.body;
    const poll = await pollModel.getPollById(pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    if (!poll.active) return res.status(400).json({ error: 'Poll is not active' });
    if (!poll.options.includes(option)) return res.status(400).json({ error: 'Invalid option' });
    
    // Generate a simple userId for demo purposes
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await pollModel.addVote(pollId, option, userId);
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record vote' });
  }
}

// Get poll results
async function getResults(req, res) {
  try {
    const { pollId } = req.query;
    if (!pollId) {
      return res.status(400).json({ error: 'Poll ID is required' });
    }
    const results = await pollModel.getResults(pollId);
    if (!results) return res.status(404).json({ error: 'Poll not found' });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
}

module.exports = {
  getAllPolls,
  getActivePolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll,
  votePoll,
  getResults,
  requireAdmin,
}; 