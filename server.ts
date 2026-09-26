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
const FIREBASE_RTDB_URL = 'https://rsverify-76143-default-rtdb.firebaseio.com/poll_data.json';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read from Firebase Realtime Database with local file fallback
async function readPollDataFromFirebase() {
  try {
    const res = await fetch(FIREBASE_RTDB_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.topics) && data.topics.length > 0) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return data;
      }
    }
  } catch (err) {
    console.error('Error fetching from Firebase RTDB:', err);
  }

  // Fallback to local file
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading local poll data:', err);
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

// Write to both Firebase Realtime Database and local backup
async function writePollDataToFirebase(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local file:', err);
  }

  try {
    await fetch(FIREBASE_RTDB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('Error writing to Firebase RTDB:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Universal CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // GET /api/poll - Return current shared data from Firebase RTDB
  app.get('/api/poll', async (_req, res) => {
    const data = await readPollDataFromFirebase();
    res.json(data);
  });

  // POST /api/vote - Cast a vote in Firebase RTDB
  app.post('/api/vote', async (req, res) => {
    const { topicId, scheduleId, voterName, comment, voterId } = req.body;
    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    const data = await readPollDataFromFirebase();

    // Check if voter already voted (by voterId)
    const existingIndex = (data.votesLog || []).findIndex(
      (v: any) => v.voterId && v.voterId === voterId
    );

    if (existingIndex !== -1) {
      const prevVote = data.votesLog[existingIndex];
      data.topics = data.topics.map((t: any) =>
        t.id === prevVote.selectedTopicId ? { ...t, votes: Math.max(0, (t.votes || 0) - 1) } : t
      );
      if (prevVote.selectedScheduleId) {
        data.schedules = data.schedules.map((s: any) =>
          s.id === prevVote.selectedScheduleId ? { ...s, votes: Math.max(0, (s.votes || 0) - 1) } : s
        );
      }
      data.votesLog.splice(existingIndex, 1);
    } else {
      data.totalVoters = (data.totalVoters || 0) + 1;
    }

    const topic = data.topics.find((t: any) => t.id === topicId);
    if (topic) {
      topic.votes = (topic.votes || 0) + 1;
    }

    if (scheduleId) {
      const schedule = data.schedules.find((s: any) => s.id === scheduleId);
      if (schedule) {
        schedule.votes = (schedule.votes || 0) + 1;
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

    if (!data.votesLog) data.votesLog = [];
    data.votesLog.unshift(newVoteEntry);

    if (comment && comment.trim()) {
      if (!data.comments) data.comments = [];
      data.comments.unshift({
        id: `comment-${Date.now()}`,
        author: voterName?.trim() || 'Anonymous Developer',
        text: comment.trim(),
        topic: topic?.title || topicId,
        time: 'এইমাত্র',
      });
    }

    await writePollDataToFirebase(data);
    res.json({ success: true, poll: data, vote: newVoteEntry });
  });

  // POST /api/comment - Add comment to Firebase RTDB
  app.post('/api/comment', async (req, res) => {
    const { author, text, topic } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const data = await readPollDataFromFirebase();
    const newComment = {
      id: `comment-${Date.now()}`,
      author: author?.trim() || 'RS CAPTAIn',
      text: text.trim(),
      topic: topic || 'সাধারণ মতামত',
      time: 'এইমাত্র',
      timestamp: Date.now(),
      likes: 0,
      replies: [],
    };

    if (!data.comments) data.comments = [];
    data.comments.unshift(newComment);
    await writePollDataToFirebase(data);

    res.json({ success: true, comment: newComment, poll: data });
  });

  // POST /api/comment/reply - Add a reply to a comment
  app.post('/api/comment/reply', async (req, res) => {
    const { commentId, author, text } = req.body;
    if (!commentId || !text || !text.trim()) {
      return res.status(400).json({ error: 'commentId and text are required' });
    }

    const data = await readPollDataFromFirebase();
    if (!data.comments) data.comments = [];

    const parent = data.comments.find((c: any) => c.id === commentId);
    if (!parent) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!parent.replies) parent.replies = [];
    const newReply = {
      id: `reply-${Date.now()}`,
      author: author?.trim() || 'RS CAPTAIn',
      text: text.trim(),
      time: 'এইমাত্র',
      timestamp: Date.now(),
    };

    parent.replies.push(newReply);
    await writePollDataToFirebase(data);

    res.json({ success: true, reply: newReply, poll: data });
  });

  // POST /api/comment/like - Like a comment
  app.post('/api/comment/like', async (req, res) => {
    const { commentId } = req.body;
    if (!commentId) {
      return res.status(400).json({ error: 'commentId is required' });
    }

    const data = await readPollDataFromFirebase();
    if (!data.comments) data.comments = [];

    const comment = data.comments.find((c: any) => c.id === commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.likes = (comment.likes || 0) + 1;
    await writePollDataToFirebase(data);

    res.json({ success: true, likes: comment.likes, poll: data });
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
    console.log(`Poll Server with Firebase RTDB running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
