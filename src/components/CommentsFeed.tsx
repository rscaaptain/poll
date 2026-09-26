import React, { useState } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { CommentEntry } from '../types';

interface CommentsFeedProps {
  comments: CommentEntry[];
  onAddQuickComment: (text: string, author: string) => void;
}

export const CommentsFeed: React.FC<CommentsFeedProps> = ({
  comments,
  onAddQuickComment,
}) => {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddQuickComment(text.trim(), author.trim() || 'Dev Member');
    setText('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-5 w-5 text-[#62BD00]" />
          <h3 className="text-base font-bold text-slate-900">
            রিয়েল ভোটারদের মতামত ও লাইভ রিকোয়েস্ট ({comments.length})
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          ভোট সাবমিট করার সময় ডেভেলপার মেম্বাররা যা লিখেছেন তা স্বয়ংক্রিয়ভাবে জেসন ফাইলে সেভ হয়ে এখানে দেখা যাচ্ছে।
        </p>

        {/* Add feedback quick form */}
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="আপনার নাম বা হ্যান্ডেল"
              className="sm:w-1/3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#62BD00] focus:bg-white focus:outline-none"
            />
            <input
              type="text"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="লাইভ সেশন নিয়ে কোনো নির্দিষ্ট পরামর্শ বা রিকোয়েস্ট..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#62BD00] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#62BD00] hover:bg-[#54A400] px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>পোস্ট</span>
            </button>
          </div>
        </form>
      </div>

      {/* Empty State */}
      {comments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-xs">
          এখনো কোনো মতামত জমা পড়েনি। ভোট দেওয়ার সময় আপনার প্রথম মতামতটি শেয়ার করুন!
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F2FCE8] text-[#3F7B00] font-bold text-xs border border-[#62BD00]/30">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold text-slate-900">{comment.author}</span>
              </div>
              <span className="text-[11px] text-slate-400">{comment.time}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
              {comment.text}
            </p>

            {comment.topic && (
              <div className="mt-2 pl-8">
                <span className="inline-block rounded-md bg-[#F2FCE8] border border-[#62BD00]/30 px-2 py-0.5 text-[11px] font-semibold text-[#2D5A00]">
                  ভোট দিয়েছেন: {comment.topic}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
