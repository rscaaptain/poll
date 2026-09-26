import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'poll_store.json');

// Ensure data file exists with 0 fake votes
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readPollData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading poll data:', err);
  }

  // Fallback to src/data/poll_store.json
  const defaultFile = path.join(__dirname, 'src', 'data', 'poll_store.json');
  if (fs.existsSync(defaultFile)) {
    const content = fs.readFileSync(defaultFile, 'utf-8');
    fs.writeFileSync(DATA_FILE, content, 'utf-8');
    return JSON.parse(content);
  }

  return {
    pollId: 'dev-society-live-2026',
    title: 'Developer Society — Next Live Stream Topic & Time',
    subtitle: 'কমিউনিটির পরবর্তী লাইভ সেশনের টপিক এবং সময় নির্ধারণে আপনার রিয়েল ভোট দিন।',
    status: 'active',
    createdAt: '2026-09-26',
    totalVoters: 0,
    topics: [],
    schedules: [],
    votesLog: [],
    comments: [],
  };
}

function writePollData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing poll data:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // GET /api/poll - Return current poll state
  app.get('/api/poll', (_req, res) => {
    const data = readPollData();
    res.json(data);
  });

  // POST /api/vote - Cast a vote
  app.post('/api/vote', (req, res) => {
    const { topicId, scheduleId, voterName, comment, voterId } = req.body;
    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    const data = readPollData();

    // Check if voter already voted (by voterId)
    const existingIndex = data.votesLog.findIndex(
      (v: any) => v.voterId && v.voterId === voterId
    );

    if (existingIndex !== -1) {
      // Voter is updating vote
      const prevVote = data.votesLog[existingIndex];
      // Decrement previous
      data.topics = data.topics.map((t: any) =>
        t.id === prevVote.selectedTopicId ? { ...t, votes: Math.max(0, t.votes - 1) } : t
      );
      if (prevVote.selectedScheduleId) {
        data.schedules = data.schedules.map((s: any) =>
          s.id === prevVote.selectedScheduleId ? { ...s, votes: Math.max(0, s.votes - 1) } : s
        );
      }
      // Remove old log
      data.votesLog.splice(existingIndex, 1);
    } else {
      data.totalVoters += 1;
    }

    // Increment new choices
    const topic = data.topics.find((t: any) => t.id === topicId);
    if (topic) {
      topic.votes += 1;
    }

    if (scheduleId) {
      const schedule = data.schedules.find((s: any) => s.id === scheduleId);
      if (schedule) {
        schedule.votes += 1;
      }
    }

    const newVoteEntry = {
      id: `vote-${Date.now()}`,
      voterId: voterId || `voter-${Date.now()}`,
      voterName: voterName?.trim() || 'Anonymous Developer',
      selectedTopicId: topicId,
      selectedTopicTitle: topic?.title || topicId,
      selectedScheduleId: scheduleId,
      timestamp: new Date().toISOString(),
      comment: comment?.trim() || undefined,
    };

    data.votesLog.unshift(newVoteEntry);

    if (comment && comment.trim()) {
      data.comments.unshift({
        id: `comment-${Date.now()}`,
        author: voterName?.trim() || 'Anonymous Developer',
        text: comment.trim(),
        topic: topic?.title || topicId,
        time: 'Just now',
      });
    }

    writePollData(data);
    res.json({ success: true, poll: data, vote: newVoteEntry });
  });

  // POST /api/change-vote - Clear vote for voter
  app.post('/api/change-vote', (req, res) => {
    const { voterId } = req.body;
    if (!voterId) {
      return res.status(400).json({ error: 'voterId required' });
    }

    const data = readPollData();
    const existingIndex = data.votesLog.findIndex(
      (v: any) => v.voterId && v.voterId === voterId
    );

    if (existingIndex !== -1) {
      const prevVote = data.votesLog[existingIndex];
      data.topics = data.topics.map((t: any) =>
        t.id === prevVote.selectedTopicId ? { ...t, votes: Math.max(0, t.votes - 1) } : t
      );
      if (prevVote.selectedScheduleId) {
        data.schedules = data.schedules.map((s: any) =>
          s.id === prevVote.selectedScheduleId ? { ...s, votes: Math.max(0, s.votes - 1) } : s
        );
      }
      data.votesLog.splice(existingIndex, 1);
      data.totalVoters = Math.max(0, data.totalVoters - 1);
      writePollData(data);
    }

    res.json({ success: true, poll: data });
  });

  // POST /api/reset - Reset to 0 real votes (testing utility)
  app.post('/api/reset', (_req, res) => {
    const data = readPollData();
    data.totalVoters = 0;
    data.topics = data.topics.map((t: any) => ({ ...t, votes: 0 }));
    data.schedules = data.schedules.map((s: any) => ({ ...s, votes: 0 }));
    data.votesLog = [];
    data.comments = [];
    writePollData(data);
    res.json({ success: true, poll: data });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Poll Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
