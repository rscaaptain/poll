import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2, RotateCcw } from 'lucide-react';
import { PollData } from '../types';

interface JsonViewerProps {
  data: PollData;
  onResetData: () => void;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, onResetData }) => {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poll_store_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-[#62BD00]" />
            <h3 className="text-base font-bold text-slate-900">
              রিয়েল জেসন স্টোর (data/poll_store.json)
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            এখানে কোনো ফেক ডেটা নেই। প্রতিটি রিয়েল ভোট, ভোটারের নাম, টাইমস্ট্যাম্প ও মতামত এই জেসন ফাইলে লাইভ স্টোর হচ্ছে।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#62BD00]" />
                <span className="text-[#3F7B00]">কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>কপি জেসন</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-xl bg-[#62BD00] hover:bg-[#54A400] px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>ডাউনলোড (.json)</span>
          </button>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
          <span className="block text-[11px] font-medium text-slate-500">মোট ভোটার</span>
          <span className="text-lg font-extrabold text-[#3F7B00] font-mono">
            {data.totalVoters}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
          <span className="block text-[11px] font-medium text-slate-500">ভোট লগ রেকর্ড</span>
          <span className="text-lg font-extrabold text-slate-800 font-mono">
            {data.votesLog.length}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
          <span className="block text-[11px] font-medium text-slate-500">মতামত কাউন্ট</span>
          <span className="text-lg font-extrabold text-[#62BD00] font-mono">
            {data.comments.length}
          </span>
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-4 text-emerald-400 font-mono text-xs overflow-x-auto shadow-md max-h-[500px] leading-relaxed">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
          <span>// Live JSON representation</span>
          <span className="text-[#62BD00]">status: active & verified</span>
        </div>
        <pre className="text-slate-300">
          <code>{jsonString}</code>
        </pre>
      </div>

      {/* Reset Testing helper */}
      <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-500">
        <span>পরীক্ষা করার জন্য ভোট রিসেট করতে চান?</span>
        <button
          onClick={onResetData}
          className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>সকল ভোট ০ তে রিসেট করুন</span>
        </button>
      </div>
    </div>
  );
};
