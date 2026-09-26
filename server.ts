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

// Ensure data directory exists
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

  return {
    pollId: 'dev-society-ai-agents-2026',
    title: 'Autonomous AI Agent Setup & 24/7 AI Support Systems Voting',
    subtitle: 'অত্যাধুনিক অটোনোমাস এআই এজেন্ট আর্কিটেকচার, ২৪/৭ এআই কাস্টমার সাপোর্ট সেটআপ এবং বিজনেস অটোমেশনের পরবর্তী লাইভ মাস্টারক্লাসের টপিক নির্বাচনে আপনার ভোট দিন।',
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
    console.error('Error writing poll data to JSON file:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Universal CORS support so clients from GitHub Pages, mobile or local can access
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // GET /api/poll - Return current shared JSON data
  app.get('/api/poll', (_req, res) => {
    const data = readPollData();
    res.json(data);
  });

  // GET /api/download-json - Download raw poll_store.json file
  app.get('/api/download-json', (_req, res) => {
    const data = readPollData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="poll_store.json"');
    res.send(JSON.stringify(data, null, 2));
  });

  // POST /api/vote - Cast a vote and save to JSON
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
        time: 'এইমাত্র',
      });
    }

    writePollData(data);
    res.json({ success: true, poll: data, vote: newVoteEntry });
  });

  // POST /api/comment - Add comment only and save to JSON
  app.post('/api/comment', (req, res) => {
    const { author, text, topic } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const data = readPollData();
    const newComment = {
      id: `comment-${Date.now()}`,
      author: author?.trim() || 'Dev Member',
      text: text.trim(),
      topic: topic || 'সাধারণ মতামত',
      time: 'এইমাত্র',
    };

    data.comments.unshift(newComment);
    writePollData(data);

    res.json({ success: true, comment: newComment, poll: data });
  });

  // POST /api/reset - Reset to 0 real votes
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

  // Serve static data directory for direct JSON access
  app.use('/data', express.static(DATA_DIR));

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
