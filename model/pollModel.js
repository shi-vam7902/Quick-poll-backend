const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const pollSchema = new mongoose.Schema({
  pollId: { type: String, required: true, unique: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

const Poll = mongoose.model('Poll', pollSchema);

// In-memory vote storage for demo purposes
const voteStorage = {};

async function createPoll(question, options) {
  const poll = new Poll({
    pollId: uuidv4(),
    question,
    options,
    active: true,
  });
  await poll.save();
  return poll;
}

async function getAllPolls() {
  return await Poll.find({}).sort({ createdAt: -1 });
}

async function getActivePolls() {
  return await Poll.find({ active: true }).sort({ createdAt: -1 });
}

async function getPollById(pollId) {
  return await Poll.findOne({ pollId });
}

async function updatePoll(pollId, updateData) {
  const poll = await Poll.findOneAndUpdate(
    { pollId },
    updateData,
    { new: true, runValidators: true }
  );
  return poll;
}

async function deletePoll(pollId) {
  // Also clean up vote storage
  if (voteStorage[pollId]) {
    delete voteStorage[pollId];
  }
  return await Poll.findOneAndDelete({ pollId });
}

async function addVote(pollId, option, userId) {
  // Initialize poll votes if not exists
  if (!voteStorage[pollId]) {
    const poll = await getPollById(pollId);
    if (poll) {
      voteStorage[pollId] = {};
      poll.options.forEach(opt => {
        voteStorage[pollId][opt] = 0;
      });
    }
  }
  
  // Record the vote
  if (voteStorage[pollId] && voteStorage[pollId][option] !== undefined) {
    voteStorage[pollId][option]++;
    console.log(`Vote recorded: pollId=${pollId}, option=${option}, userId=${userId}`);
    console.log(`Current votes for ${pollId}:`, voteStorage[pollId]);
  }
}

async function getResults(pollId) {
  const poll = await getPollById(pollId);
  if (!poll) return null;
  
  // Initialize poll votes if not exists
  if (!voteStorage[pollId]) {
    voteStorage[pollId] = {};
    poll.options.forEach(opt => {
      voteStorage[pollId][opt] = 0;
    });
  }
  
  const totalVotes = Object.values(voteStorage[pollId]).reduce((sum, count) => sum + count, 0);
  
  return { 
    pollId, 
    question: poll.question,
    options: poll.options,
    active: poll.active,
    results: voteStorage[pollId],
    totalVotes
  };
}

module.exports = {
  createPoll,
  getAllPolls,
  getActivePolls,
  getPollById,
  updatePoll,
  deletePoll,
  addVote,
  getResults,
  Poll,
}; 