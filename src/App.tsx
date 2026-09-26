import React, { useState, useEffect } from 'react';
import initialPollStore from './data/poll_store.json';
import { PollData, VoteLogEntry, CommentEntry } from './types';
import { WhatsAppHeader } from './components/WhatsAppHeader';
import { VotingPoll } from './components/VotingPoll';
import { CommentsFeed } from './components/CommentsFeed';
import { CheckCircle2 } from 'lucide-react';

const STORAGE_KEY_POLL_DATA = 'dev_society_static_poll_data_v1';
const STORAGE_KEY_VOTER_ID = 'dev_society_voter_id_v1';
const STORAGE_KEY_USER_VOTE = 'dev_society_user_vote_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'poll' | 'comments'>('poll');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistent unique voter identifier for this browser/device
  const [voterId] = useState<string>(() => {
    try {
      let id = localStorage.getItem(STORAGE_KEY_VOTER_ID);
      if (!id) {
        id = `voter_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
        localStorage.setItem(STORAGE_KEY_VOTER_ID, id);
      }
      return id;
    } catch {
      return `voter_${Date.now()}`;
    }
  });

  // Current user's recorded vote
  const [userVote, setUserVote] = useState<{
    topicId: string | null;
    scheduleId: string | null;
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_VOTE);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { topicId: null, scheduleId: null };
  });

  // Internal JSON Poll Store (self-contained, private, persistent)
  const [pollData, setPollData] = useState<PollData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POLL_DATA);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.topics && parsed.topics.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return initialPollStore as PollData;
  });

  // Optional background sync with server if available (e.g. in full-stack mode)
  useEffect(() => {
    let isMounted = true;
    const syncWithBackend = async () => {
      try {
        const res = await fetch('/api/poll', { signal: AbortSignal.timeout(1500) });
        if (res.ok && isMounted) {
          const remoteData = await res.json();
          if (remoteData && remoteData.topics) {
            setPollData(remoteData);
            // Check if user already voted in remote log
            const myVote = remoteData.votesLog?.find((v: VoteLogEntry) => v.voterId === voterId);
            if (myVote) {
              setUserVote({
                topicId: myVote.selectedTopicId,
                scheduleId: myVote.selectedScheduleId || null,
              });
            }
          }
        }
      } catch {
        // In static GitHub Pages deployment, fetch fails gracefully and localStorage is authoritative
      }
    };

    syncWithBackend();
    return () => {
      isMounted = false;
    };
  }, [voterId]);

  // Save JSON data to local storage on any update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POLL_DATA, JSON.stringify(pollData));
    } catch {
      // ignore
    }
  }, [pollData]);

  // Save user's personal vote to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER_VOTE, JSON.stringify(userVote));
    } catch {
      // ignore
    }
  }, [userVote]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle voting
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
    const topicObj = pollData.topics.find((t) => t.id === topicId);
    const prevTopicId = userVote.topicId;
    const prevScheduleId = userVote.scheduleId;

    // Recalculate options
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

    const updatedPollData: PollData = {
      ...pollData,
      totalVoters: prevTopicId ? pollData.totalVoters : pollData.totalVoters + 1,
      topics: updatedTopics,
      schedules: updatedSchedules,
      votesLog: [newVoteEntry, ...pollData.votesLog.filter((v) => v.voterId !== voterId)],
      comments: newComments,
    };

    // Update state & store
    setPollData(updatedPollData);
    setUserVote({ topicId, scheduleId });

    // Background server notification if server is running
    try {
      fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          scheduleId,
          voterName,
          comment,
          voterId,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }

    showToast('আপনার ভোট সফলভাবে সংরক্ষিত হয়েছে!');
  };

  // Handle changing vote
  const handleChangeVote = () => {
    const prevTopicId = userVote.topicId;
    const prevScheduleId = userVote.scheduleId;

    if (prevTopicId) {
      setPollData((prev) => ({
        ...prev,
        totalVoters: Math.max(0, prev.totalVoters - 1),
        topics: prev.topics.map((t) =>
          t.id === prevTopicId ? { ...t, votes: Math.max(0, t.votes - 1) } : t
        ),
        schedules: prev.schedules.map((s) =>
          s.id === prevScheduleId ? { ...s, votes: Math.max(0, s.votes - 1) } : s
        ),
        votesLog: prev.votesLog.filter((v) => v.voterId !== voterId),
      }));
    }

    setUserVote({ topicId: null, scheduleId: null });

    // Optional server notify
    try {
      fetch('/api/change-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId }),
      }).catch(() => {});
    } catch {
      // ignore
    }

    showToast('ভোট রিসেট করা হয়েছে। নতুন অপশন সিলেক্ট করুন।');
  };

  // Reset data to 0 (for testing)
  const handleResetData = () => {
    const confirm = window.confirm('আপনি কি নিশ্চিত যে টেস্ট করার জন্য সকল ভোট রিসেট করে ০ তে নিতে চান?');
    if (!confirm) return;

    const resetData: PollData = {
      ...pollData,
      totalVoters: 0,
      topics: pollData.topics.map((t) => ({ ...t, votes: 0 })),
      schedules: pollData.schedules.map((s) => ({ ...s, votes: 0 })),
      votesLog: [],
      comments: [],
    };

    setPollData(resetData);
    setUserVote({ topicId: null, scheduleId: null });

    try {
      fetch('/api/reset', { method: 'POST' }).catch(() => {});
    } catch {
      // ignore
    }

    showToast('সকল ভোট রিসেট হয়েছে। এখন ০ টি ভোট রয়েছে!');
  };

  // Quick comment post
  const handleAddQuickComment = (text: string, author: string) => {
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
    const shareText = `📢 ডেভেলপার সোসাইটি গ্রুপে নেক্সট লাইভ স্ট্রিম টপিক নির্ধারণে ভোটিং চলছে! আপনার ভোট দিন:\n${window.location.href}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast('গ্রুপে শেয়ার করার লিংক ও টেক্সট কপি হয়েছে!');
    }
  };

  const totalVotesCount = pollData.topics.reduce((acc, t) => acc + t.votes, 0);

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-slate-800 flex flex-col font-sans">
      {/* WhatsApp Styled Header with 2 Tabs: ভোটিং পোল and মতামত */}
      <WhatsAppHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalVotes={totalVotesCount}
        commentsCount={pollData.comments.length}
      />

      {/* Main Container - Responsive for mobile and PC */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3.5 sm:px-4 py-5 sm:py-7">
        {/* Tab 1: Core Polling & Voting */}
        {activeTab === 'poll' && (
          <VotingPoll
            pollData={pollData}
            userVotedTopicId={userVote.topicId}
            userVotedScheduleId={userVote.scheduleId}
            onCastVote={handleCastVote}
            onChangeVote={handleChangeVote}
            onResetData={handleResetData}
            onShare={handleShare}
          />
        )}

        {/* Tab 2: Comments / Real Feedback */}
        {activeTab === 'comments' && (
          <CommentsFeed
            comments={pollData.comments}
            onAddQuickComment={handleAddQuickComment}
          />
        )}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="mt-auto py-5 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white">
        <p className="font-semibold text-slate-700">
          Developer Society • Community Polling Portal
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400 font-mono">
          Theme #62BD00 • Static & Mobile-Ready
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
