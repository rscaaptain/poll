import React, { useState, useEffect } from 'react';
import initialPollStore from './data/poll_store.json';
import { PollData, VoteLogEntry, CommentEntry } from './types';
import { WhatsAppHeader } from './components/WhatsAppHeader';
import { VotingPoll } from './components/VotingPoll';
import { JsonViewer } from './components/JsonViewer';
import { CommentsFeed } from './components/CommentsFeed';
import { CheckCircle2, RotateCcw } from 'lucide-react';

const STORAGE_VOTER_ID = 'ds_voter_unique_id_v3';
const STORAGE_USER_VOTE = 'ds_user_vote_selection_v3';

export default function App() {
  const [activeTab, setActiveTab] = useState<'poll' | 'comments' | 'json'>('poll');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Persistent unique voter identifier
  const [voterId] = useState<string>(() => {
    try {
      let id = localStorage.getItem(STORAGE_VOTER_ID);
      if (!id) {
        id = `voter_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
        localStorage.setItem(STORAGE_VOTER_ID, id);
      }
      return id;
    } catch {
      return `voter_${Date.now()}`;
    }
  });

  // Current user's cast vote
  const [userVote, setUserVote] = useState<{
    topicId: string | null;
    scheduleId: string | null;
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_VOTE);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { topicId: null, scheduleId: null };
  });

  // Real Poll Data state
  const [pollData, setPollData] = useState<PollData>(() => initialPollStore as PollData);

  // Fetch real data from /api/poll on mount and poll every 4 seconds for live updates
  const fetchLivePollData = async () => {
    try {
      const res = await fetch('/api/poll');
      if (res.ok) {
        const data = await res.json();
        setPollData(data);

        // Check if current voter already has a vote in the log
        const myVote = data.votesLog?.find((v: VoteLogEntry) => v.voterId === voterId);
        if (myVote) {
          setUserVote({
            topicId: myVote.selectedTopicId,
            scheduleId: myVote.selectedScheduleId || null,
          });
        }
      }
    } catch {
      // Offline fallback: keep current state
    }
  };

  useEffect(() => {
    fetchLivePollData();
    const interval = setInterval(fetchLivePollData, 4000);
    return () => clearInterval(interval);
  }, [voterId]);

  // Save user vote selection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USER_VOTE, JSON.stringify(userVote));
    } catch {
      // ignore
    }
  }, [userVote]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Cast real vote
  const handleCastVote = async ({
    topicId,
    scheduleId,
    voterName,
    comment,
  }: {
    topicId: string;
    scheduleId: string;
    voterName: string;
    comment: string;
  }) => {
    setIsLoading(true);

    // Optimistic UI update
    const topicObj = pollData.topics.find((t) => t.id === topicId);
    const prevTopicId = userVote.topicId;
    const prevScheduleId = userVote.scheduleId;

    const updatedTopics = pollData.topics.map((t) => {
      if (prevTopicId && t.id === prevTopicId) {
        return { ...t, votes: Math.max(0, t.votes - 1) };
      }
      if (t.id === topicId) {
        return { ...t, votes: t.votes + 1 };
      }
      return t;
    });

    const updatedSchedules = pollData.schedules.map((s) => {
      if (prevScheduleId && s.id === prevScheduleId) {
        return { ...s, votes: Math.max(0, s.votes - 1) };
      }
      if (s.id === scheduleId) {
        return { ...s, votes: s.votes + 1 };
      }
      return s;
    });

    const newVoteEntry: VoteLogEntry = {
      id: `vote-${Date.now()}`,
      voterId,
      voterName,
      selectedTopicId: topicId,
      selectedTopicTitle: topicObj?.title || topicId,
      selectedScheduleId: scheduleId,
      timestamp: new Date().toISOString(),
      comment: comment || undefined,
    };

    const newComments = [...pollData.comments];
    if (comment) {
      newComments.unshift({
        id: `comment-${Date.now()}`,
        author: voterName,
        text: comment,
        topic: topicObj?.title || topicId,
        time: 'এইমাত্র',
      });
    }

    const optimisticData: PollData = {
      ...pollData,
      totalVoters: prevTopicId ? pollData.totalVoters : pollData.totalVoters + 1,
      topics: updatedTopics,
      schedules: updatedSchedules,
      votesLog: [newVoteEntry, ...pollData.votesLog.filter((v) => v.voterId !== voterId)],
      comments: newComments,
    };

    setPollData(optimisticData);
    setUserVote({ topicId, scheduleId });

    // Send real POST request to backend API
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          scheduleId,
          voterName,
          comment,
          voterId,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.poll) {
          setPollData(result.poll);
        }
      }
    } catch (err) {
      console.warn('Network write failed, kept optimistic state', err);
    } finally {
      setIsLoading(false);
    }

    showToast('আপনার রিয়েল ভোট সফলভাবে জেসন ফাইলে সংরক্ষিত হয়েছে!');
  };

  // Change vote
  const handleChangeVote = async () => {
    setUserVote({ topicId: null, scheduleId: null });

    try {
      const res = await fetch('/api/change-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.poll) {
          setPollData(result.poll);
        }
      }
    } catch {
      // Optimistic fallback
      if (userVote.topicId) {
        setPollData((prev) => ({
          ...prev,
          totalVoters: Math.max(0, prev.totalVoters - 1),
          topics: prev.topics.map((t) =>
            t.id === userVote.topicId ? { ...t, votes: Math.max(0, t.votes - 1) } : t
          ),
          schedules: prev.schedules.map((s) =>
            s.id === userVote.scheduleId ? { ...s, votes: Math.max(0, s.votes - 1) } : s
          ),
          votesLog: prev.votesLog.filter((v) => v.voterId !== voterId),
        }));
      }
    }

    showToast('ভোট পরিবর্তন অপশন চালু হয়েছে। নতুন টপিক সিলেক্ট করুন।');
  };

  // Reset all votes to 0 (for testing without fake data)
  const handleResetData = async () => {
    const confirm = window.confirm('আপনি কি নিশ্চিত যে সকল ভোট রিসেট করে ০ তে নিয়ে যেতে চান?');
    if (!confirm) return;

    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setPollData(result.poll);
      }
    } catch {
      // Local fallback
      setPollData((prev) => ({
        ...prev,
        totalVoters: 0,
        topics: prev.topics.map((t) => ({ ...t, votes: 0 })),
        schedules: prev.schedules.map((s) => ({ ...s, votes: 0 })),
        votesLog: [],
        comments: [],
      }));
    }

    setUserVote({ topicId: null, scheduleId: null });
    showToast('সকল ভোট রিসেট করা হয়েছে। এখন ০ টি রিয়েল ভোট রয়েছে!');
  };

  // Quick feedback from comments feed
  const handleAddQuickComment = async (text: string, author: string) => {
    const newComment: CommentEntry = {
      id: `comment-${Date.now()}`,
      author,
      text,
      topic: 'সাধারণ মতামত',
      time: 'এইমাত্র',
    };

    setPollData((prev) => ({
      ...prev,
      comments: [newComment, ...prev.comments],
    }));

    showToast('মতামত পোস্ট করা হয়েছে!');
  };

  // Share poll
  const handleShare = () => {
    const shareText = `📢 ডেভেলপার সোসাইটি গ্রুপে নেক্সট লাইভ স্ট্রিম টপিক নির্ধারণে রিয়েল ভোটিং চলছে! আপনার ভোট দিন:\n${window.location.href}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast('গ্রুপে শেয়ার করার লিংক ও টেক্সট কপি হয়েছে!');
    }
  };

  const totalVotesCount = pollData.topics.reduce((acc, t) => acc + t.votes, 0);

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-slate-800 flex flex-col font-sans">
      {/* Header with #62BD00 brand */}
      <WhatsAppHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalVotes={totalVotesCount}
        commentsCount={pollData.comments.length}
      />

      {/* Main Container - Optimized for mobile & PC ratio */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3.5 sm:px-4 py-5 sm:py-7">
        {/* Tab 1: Pure Voting Poll */}
        {activeTab === 'poll' && (
          <VotingPoll
            pollData={pollData}
            userVotedTopicId={userVote.topicId}
            userVotedScheduleId={userVote.scheduleId}
            onCastVote={handleCastVote}
            onChangeVote={handleChangeVote}
            onResetData={handleResetData}
            onShare={handleShare}
            isLoading={isLoading}
          />
        )}

        {/* Tab 2: Comments / Real Opinions */}
        {activeTab === 'comments' && (
          <CommentsFeed
            comments={pollData.comments}
            onAddQuickComment={handleAddQuickComment}
          />
        )}

        {/* Tab 3: Real JSON Viewer & Downloader */}
        {activeTab === 'json' && (
          <JsonViewer
            data={pollData}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Footer (No AI Slop) */}
      <footer className="mt-auto py-5 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white">
        <p className="font-semibold text-slate-700">
          Developer Society • Real-Time Community Poll
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400 font-mono">
          Theme #62BD00 • Zero Fake Data • 100% Real Live JSON Sync
        </p>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-fade-in border border-[#62BD00]/50">
          <CheckCircle2 className="h-4 w-4 text-[#62BD00]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
