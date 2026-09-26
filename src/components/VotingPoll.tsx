import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Check,
  Share2,
  Trophy,
  RefreshCw,
  Send,
  Sparkles,
  BarChart2,
  Clock,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { PollData } from '../types';

interface VotingPollProps {
  pollData: PollData;
  userVotedTopicId: string | null;
  userVotedScheduleId: string | null;
  onCastVote: (data: {
    topicId: string;
    scheduleId: string;
    voterName: string;
    comment: string;
  }) => void;
  onChangeVote: () => void;
  onResetData: () => void;
  onShare: () => void;
  isLoading?: boolean;
}

export const VotingPoll: React.FC<VotingPollProps> = ({
  pollData,
  userVotedTopicId,
  userVotedScheduleId,
  onCastVote,
  onChangeVote,
  onResetData,
  onShare,
  isLoading,
}) => {
  const hasVoted = Boolean(userVotedTopicId);

  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    userVotedTopicId || pollData.topics[0]?.id || ''
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    userVotedScheduleId || pollData.schedules[0]?.id || ''
  );
  const [voterName, setVoterName] = useState<string>('');
  const [commentText, setCommentText] = useState<string>('');
  const [previewResults, setPreviewResults] = useState<boolean>(hasVoted);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (userVotedTopicId) {
      setSelectedTopicId(userVotedTopicId);
      setPreviewResults(true);
    }
    if (userVotedScheduleId) {
      setSelectedScheduleId(userVotedScheduleId);
    }
  }, [userVotedTopicId, userVotedScheduleId]);

  // Real calculations
  const totalTopicVotes = pollData.topics.reduce((acc, t) => acc + t.votes, 0);
  const totalScheduleVotes = pollData.schedules.reduce((acc, s) => acc + s.votes, 0);

  // Sorted by real votes
  const sortedTopics = [...pollData.topics].sort((a, b) => b.votes - a.votes);
  const leadingTopicId = totalTopicVotes > 0 && sortedTopics[0]?.votes > 0 ? sortedTopics[0]?.id : null;

  const sortedSchedules = [...pollData.schedules].sort((a, b) => b.votes - a.votes);
  const leadingScheduleId = totalScheduleVotes > 0 && sortedSchedules[0]?.votes > 0 ? sortedSchedules[0]?.id : null;

  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) {
      setErrorMessage('দয়া করে আপনার পছন্দের লাইভ টপিক সিলেক্ট করুন।');
      return;
    }

    setErrorMessage(null);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#62BD00', '#3F7B00', '#89E816', '#22c55e'],
      });
    } catch {
      // ignore
    }

    onCastVote({
      topicId: selectedTopicId,
      scheduleId: selectedScheduleId || pollData.schedules[0]?.id || '',
      voterName: voterName.trim() || 'Anonymous Developer',
      comment: commentText.trim(),
    });

    setPreviewResults(true);
  };

  const isShowingResults = hasVoted || previewResults;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header Info Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2FCE8] px-3 py-1 text-xs font-bold text-[#3F7B00] border border-[#62BD00]/30">
              <Sparkles className="h-3 w-3 text-[#62BD00]" />
              রিয়েল ভোটিং হাব
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 font-mono">
              মোট রিয়েল ভোট: <strong className="text-slate-900 font-bold">{totalTopicVotes}</strong> টি
            </span>
            {totalTopicVotes > 0 && (
              <button
                onClick={onResetData}
                title="টেস্ট করার জন্য ভোট ০ তে রিসেট করুন"
                className="text-[11px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors ml-2"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">রিসেট</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {pollData.title}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {pollData.subtitle}
          </p>
        </div>

        {/* Zero votes notification if empty */}
        {totalTopicVotes === 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
            <AlertCircle className="h-4 w-4 text-[#62BD00] shrink-0" />
            <span>
              এখনো কোনো ফেক ভোট নেই। <strong>০ টি রিয়েল ভোট</strong> রয়েছে। নিচের অপশনগুলো থেকে প্রথম ভোটটি দিয়ে শুরু করুন!
            </span>
          </div>
        )}

        {/* User Voted Banner */}
        {hasVoted && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F2FCE8] border border-[#62BD00]/40 px-3.5 py-2.5 text-xs text-[#2D5A00]">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-[#62BD00] shrink-0" />
              <span>আপনার ভোট সফলভাবে সংরক্ষিত হয়েছে! নিচে লাইভ পার্সেন্টেজ দেখুন।</span>
            </div>
            <button
              onClick={onChangeVote}
              className="flex items-center gap-1 font-bold text-[#3F7B00] hover:text-slate-900 underline cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>ভোট পরিবর্তন করুন</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Ballot Form */}
      <form onSubmit={handleVoteSubmit} className="space-y-4">
        {/* Question 1: Topic */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3F7B00] font-mono">
                প্রশ্ন ১
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                পরবর্তী লাইভে কোন টপিকের উপর সেশন চান?
              </h3>
            </div>
            {isShowingResults && (
              <span className="text-[11px] font-bold text-[#3F7B00] bg-[#F2FCE8] border border-[#62BD00]/20 rounded-md px-2 py-0.5 font-mono">
                রিয়েল পার্সেন্টেজ
              </span>
            )}
          </div>

          <div className="space-y-3">
            {pollData.topics.map((topic) => {
              const percentage =
                totalTopicVotes > 0
                  ? Math.round((topic.votes / totalTopicVotes) * 100)
                  : 0;
              const isSelected = selectedTopicId === topic.id;
              const isUserVote = userVotedTopicId === topic.id;
              const isLeading = leadingTopicId === topic.id && topic.votes > 0;

              // Results View
              if (isShowingResults) {
                return (
                  <div
                    key={topic.id}
                    onClick={() => {
                      if (!hasVoted) setSelectedTopicId(topic.id);
                    }}
                    className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
                      !hasVoted ? 'cursor-pointer hover:border-[#62BD00]' : ''
                    } ${
                      isUserVote
                        ? 'border-[#62BD00] bg-white ring-1 ring-[#62BD00]'
                        : isLeading
                        ? 'border-[#62BD00]/60 bg-white'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {/* Background #62BD00 progress bar */}
                    <div
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out ${
                        isUserVote
                          ? 'bg-[#E5F9D2]'
                          : isLeading
                          ? 'bg-[#EFFBE5]'
                          : 'bg-slate-100/90'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative z-10 flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                              isUserVote
                                ? 'border-[#62BD00] bg-[#62BD00] text-white'
                                : 'border-slate-300 bg-white text-slate-400'
                            }`}
                          >
                            {isUserVote ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`text-sm font-bold ${
                                  isUserVote ? 'text-[#2D5A00]' : 'text-slate-900'
                                }`}
                              >
                                {topic.title}
                              </h4>
                              {isUserVote && (
                                <span className="rounded bg-[#62BD00] px-1.5 py-0.2 text-[10px] font-bold text-white">
                                  আপনার ভোট
                                </span>
                              )}
                              {isLeading && (
                                <span className="inline-flex items-center gap-1 rounded bg-[#F2FCE8] border border-[#62BD00]/30 px-1.5 py-0.2 text-[10px] font-bold text-[#3F7B00]">
                                  <Trophy className="h-2.5 w-2.5 text-[#62BD00]" />
                                  সবচেয়ে বেশি ভোট
                                </span>
                              )}
                            </div>
                            {topic.description && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {topic.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Exact percentage & real count */}
                        <div className="text-right shrink-0">
                          <span
                            className={`text-base font-extrabold font-mono tabular-nums ${
                              isLeading ? 'text-[#3F7B00]' : 'text-slate-800'
                            }`}
                          >
                            {percentage}%
                          </span>
                          <p className="text-[11px] text-slate-500 font-medium font-mono">
                            {topic.votes} ভোট
                          </p>
                        </div>
                      </div>

                      {/* Vibrant #62BD00 progress indicator */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isLeading
                              ? 'bg-[#62BD00]'
                              : isUserVote
                              ? 'bg-[#62BD00]'
                              : 'bg-[#8AE81B]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              // Interactive Selection View
              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#62BD00] bg-[#F2FCE8]/40 shadow-xs ring-1 ring-[#62BD00]'
                      : 'border-slate-200 bg-white hover:border-[#62BD00]/50 hover:bg-[#F8FAF6]'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? 'border-[#62BD00] bg-[#62BD00] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>

                  <div className="flex-1">
                    <h4
                      className={`text-sm font-bold ${
                        isSelected ? 'text-[#2D5A00]' : 'text-slate-800'
                      }`}
                    >
                      {topic.title}
                    </h4>
                    {topic.description && (
                      <p className="mt-1 text-xs text-slate-500 leading-normal">
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question 2: Schedule */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3F7B00] font-mono">
                প্রশ্ন ২
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                কোন দিন এবং কোন সময়ে লাইভ হলে সুবিধা হয়?
              </h3>
            </div>
            <Clock className="h-4 w-4 text-[#62BD00]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {pollData.schedules.map((schedule) => {
              const percentage =
                totalScheduleVotes > 0
                  ? Math.round((schedule.votes / totalScheduleVotes) * 100)
                  : 0;
              const isSelected = selectedScheduleId === schedule.id;
              const isUserVote = userVotedScheduleId === schedule.id;

              return (
                <div
                  key={schedule.id}
                  onClick={() => {
                    if (!hasVoted) setSelectedScheduleId(schedule.id);
                  }}
                  className={`relative overflow-hidden rounded-xl border p-3.5 transition-all ${
                    !hasVoted ? 'cursor-pointer hover:border-[#62BD00]' : ''
                  } ${
                    isSelected
                      ? 'border-[#62BD00] bg-[#F2FCE8]/40 ring-1 ring-[#62BD00]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {isShowingResults && (
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-[#E5F9D2]/70 transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {schedule.title}
                      </span>
                      {isShowingResults && (
                        <span className="text-xs font-extrabold text-[#3F7B00] font-mono">
                          {percentage}%
                        </span>
                      )}
                    </div>
                    {isShowingResults && (
                      <p className="mt-1 text-[11px] text-slate-500 font-mono">
                        {schedule.votes} ভোট
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Identity & Feedback (if not yet voted) */}
        {!hasVoted && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              আপনার পরিচয় ও মতামত (ঐচ্ছিক)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  আপনার নাম / ইউজারনেম
                </label>
                <input
                  type="text"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  placeholder="যেমন: তানভীর আহমেদ বা @dev_arif"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#62BD00] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  লাইভ সেশন সম্পর্কে মতামত / পরামর্শ
                </label>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="যেমন: প্র্যাক্টিক্যাল কোডিং ও ফ্রি ডিপ্লয়মেন্ট গাইড"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#62BD00] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {!hasVoted ? (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#62BD00] hover:bg-[#54A400] text-white py-3.5 px-6 font-extrabold text-base shadow-sm active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isLoading ? 'সংরক্ষণ হচ্ছে...' : 'ভোট সাবমিট করুন (Submit Vote)'}</span>
            </button>
          ) : (
            <div className="w-full sm:flex-1 flex gap-2">
              <button
                type="button"
                onClick={onChangeVote}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-3 px-4 font-bold text-xs sm:text-sm text-slate-700 shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 text-[#62BD00]" />
                <span>ভোট পরিবর্তন করুন</span>
              </button>
            </div>
          )}

          {!hasVoted && (
            <button
              type="button"
              onClick={() => setPreviewResults(!previewResults)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-3.5 px-5 font-bold text-xs sm:text-sm text-slate-700 shadow-xs transition-all cursor-pointer"
            >
              <BarChart2 className="h-4 w-4 text-[#62BD00]" />
              <span>{previewResults ? 'ভোট দেওয়ার ফর্মে ফিরুন' : 'বর্তমান ফলাফল দেখুন'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onShare}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-[#62BD00]/30 bg-[#F2FCE8] hover:bg-[#E5F9D2] py-3.5 px-5 font-bold text-xs sm:text-sm text-[#2D5A00] transition-all cursor-pointer"
            title="গ্রুপে শেয়ার করুন"
          >
            <Share2 className="h-4 w-4 text-[#62BD00]" />
            <span>গ্রুপে শেয়ার</span>
          </button>
        </div>
      </form>
    </div>
  );
};
