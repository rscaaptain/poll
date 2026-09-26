import React from 'react';
import { BarChart3, MessageSquare, Users, Radio } from 'lucide-react';

interface HeaderProps {
  activeTab: 'poll' | 'comments';
  setActiveTab: (tab: 'poll' | 'comments') => void;
  totalVotes: number;
  commentsCount: number;
}

export const WhatsAppHeader: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalVotes,
  commentsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Top Brand Bar */}
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Logo badge with #62BD00 */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#62BD00] text-white font-extrabold text-sm shadow-sm ring-2 ring-[#62BD00]/20">
            DS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                Developer Society
              </h1>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#62BD00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#62BD00]"></span>
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <span>Next Live Stream Poll</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Users className="h-3 w-3 text-[#62BD00]" />
                <span className="tabular-nums font-mono text-slate-900">{totalVotes}</span> রিয়েল ভোট
              </span>
            </p>
          </div>
        </div>

        {/* Live Badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-[#F2FCE8] px-3 py-1 text-xs font-bold text-[#3F7B00] border border-[#62BD00]/30">
          <Radio className="h-3 w-3 text-[#62BD00] animate-pulse" />
          <span>পোল সক্রিয়</span>
        </div>
      </div>

      {/* Navigation Tabs - Exactly TWO tabs: ভোটিং পোল and মতামত */}
      <div className="mx-auto flex max-w-2xl border-t border-slate-100 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('poll')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors relative cursor-pointer ${
            activeTab === 'poll'
              ? 'text-slate-900 font-bold border-b-2 border-[#62BD00] bg-[#F2FCE8]/50'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className={`h-4 w-4 ${activeTab === 'poll' ? 'text-[#62BD00]' : 'text-slate-400'}`} />
          <span>ভোটিং পোল ({totalVotes})</span>
        </button>

        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors relative cursor-pointer ${
            activeTab === 'comments'
              ? 'text-slate-900 font-bold border-b-2 border-[#62BD00] bg-[#F2FCE8]/50'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className={`h-4 w-4 ${activeTab === 'comments' ? 'text-[#62BD00]' : 'text-slate-400'}`} />
          <span>মতামত ({commentsCount})</span>
        </button>
      </div>
    </header>
  );
};
