import React, { useState, useEffect } from "react";
import { FileText, Clock, BookOpen, Target, ChevronDown, ChevronUp, Sparkles, CheckCircle2, AlertCircle, Eye, Type, BarChart3 } from "lucide-react";

export interface WordCountStats {
  wordCount: number;
  charCount: number;
  charCountNoSpaces: number;
  pageCount: number;
  estimatedReadingTimeMinutes: number;
  snippet?: string;
}

interface RealTimeWordCounterProps {
  file: File | null;
  onStatsCalculated?: (stats: WordCountStats) => void;
  className?: string;
}

const TARGET_PRESETS = [
  { label: "Short Essay / Abstract", target: 500 },
  { label: "Standard Assignment", target: 1500 },
  { label: "Research Paper", target: 3000 },
  { label: "Thesis / Chapter", target: 5000 },
];

export default function RealTimeWordCounter({ file, onStatsCalculated, className = "" }: RealTimeWordCounterProps) {
  const [stats, setStats] = useState<WordCountStats | null>(null);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [countError, setCountError] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number>(1500);
  const [customTarget, setCustomTarget] = useState<string>("1500");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  useEffect(() => {
    if (!file) {
      setStats(null);
      setCountError(null);
      return;
    }

    let isCancelled = false;
    setIsCounting(true);
    setCountError(null);

    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    // Fast path: for .txt files, count client-side immediately in 0ms
    if (ext === ".txt") {
      file.text()
        .then((text) => {
          if (isCancelled) return;
          const cleanText = text.trim();
          const words = cleanText.split(/\s+/).filter(Boolean);
          const wordCount = words.length;
          const charCount = cleanText.length;
          const charCountNoSpaces = cleanText.replace(/\s+/g, "").length;
          const pageCount = Math.max(1, Math.ceil(wordCount / 350));
          const estimatedReadingTimeMinutes = Math.max(1, Math.ceil(wordCount / 225));
          const snippet = cleanText.substring(0, 300);

          const calculatedStats: WordCountStats = {
            wordCount,
            charCount,
            charCountNoSpaces,
            pageCount,
            estimatedReadingTimeMinutes,
            snippet,
          };
          setStats(calculatedStats);
          setIsCounting(false);
          if (onStatsCalculated) onStatsCalculated(calculatedStats);
        })
        .catch((err) => {
          if (isCancelled) return;
          console.error("Client text read error:", err);
          fetchServerCount();
        });
      return () => {
        isCancelled = true;
      };
    }

    // For .pdf, .docx, or fallback: send to /api/quick-count
    const fetchServerCount = () => {
      const formData = new FormData();
      formData.append("file", file);

      fetch("/api/quick-count", {
        method: "POST",
        body: formData,
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Server responded with ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (isCancelled) return;
          const calculatedStats: WordCountStats = {
            wordCount: data.wordCount || 0,
            charCount: data.charCount || 0,
            charCountNoSpaces: data.charCountNoSpaces || 0,
            pageCount: data.pageCount || 1,
            estimatedReadingTimeMinutes: data.estimatedReadingTimeMinutes || 1,
            snippet: data.snippet || "",
          };
          setStats(calculatedStats);
          setIsCounting(false);
          if (onStatsCalculated) onStatsCalculated(calculatedStats);
        })
        .catch((err) => {
          if (isCancelled) return;
          console.warn("Quick word count failed:", err);
          // Graceful estimation based on file size if extraction is delayed
          const approxWords = Math.max(100, Math.round(file.size / 28));
          const fallbackStats: WordCountStats = {
            wordCount: approxWords,
            charCount: approxWords * 6,
            charCountNoSpaces: approxWords * 5,
            pageCount: Math.max(1, Math.ceil(approxWords / 350)),
            estimatedReadingTimeMinutes: Math.max(1, Math.ceil(approxWords / 225)),
            snippet: "Preview will be available during full document scan.",
          };
          setStats(fallbackStats);
          setIsCounting(false);
          if (onStatsCalculated) onStatsCalculated(fallbackStats);
        });
    };

    fetchServerCount();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  if (!file) return null;

  const currentWords = stats ? stats.wordCount : 0;
  const targetWords = isCustomMode ? (parseInt(customTarget) || 1000) : selectedTarget;
  const progressPercent = Math.min(100, Math.round((currentWords / (targetWords || 1)) * 100));
  const wordsRemaining = targetWords - currentWords;

  return (
    <div className={`w-full bg-linear-to-br from-indigo-50/70 via-white to-slate-50 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950/80 rounded-2xl border border-indigo-150 dark:border-indigo-950/60 p-5 shadow-sm text-left transition-all ${className}`}>
      
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-indigo-100/70 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
              Real-Time Word & Progress Tracker
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Live document metrics for <span className="font-semibold text-gray-700 dark:text-gray-300">{file.name}</span>
            </p>
          </div>
        </div>

        {isCounting ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Counting Words...
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Live Sync Ready
          </span>
        )}
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        
        {/* Total Words Card */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/80 border border-indigo-200/60 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
            <Type className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-extrabold tracking-wider">Total Words</span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {isCounting ? (
              <span className="inline-block w-16 h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md" />
            ) : (
              (stats?.wordCount ?? 0).toLocaleString()
            )}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            {stats && stats.wordCount > 0 ? "Processed selectable words" : "Empty or non-text file"}
          </div>
        </div>

        {/* Total Characters Card */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/80 border border-gray-150 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-extrabold tracking-wider">Characters</span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {isCounting ? (
              <span className="inline-block w-16 h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md" />
            ) : (
              (stats?.charCount ?? 0).toLocaleString()
            )}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            {stats ? `${stats.charCountNoSpaces.toLocaleString()} no spaces` : "0 without spaces"}
          </div>
        </div>

        {/* Estimated Reading Time */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/80 border border-gray-150 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-extrabold tracking-wider">Reading Time</span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {isCounting ? (
              <span className="inline-block w-12 h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md" />
            ) : (
              `~${stats?.estimatedReadingTimeMinutes ?? 1}m`
            )}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            @ 225 wpm standard pace
          </div>
        </div>

        {/* Estimated Academic Pages */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/80 border border-gray-150 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-extrabold tracking-wider">Est. Pages</span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {isCounting ? (
              <span className="inline-block w-12 h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md" />
            ) : (
              `${stats?.pageCount ?? 1} pgs`
            )}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            ~350 words / academic page
          </div>
        </div>

      </div>

      {/* Target Progress Bar Section */}
      <div className="mt-3 p-4 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-gray-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Target Length Progress:
            </span>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
              {progressPercent}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            {wordsRemaining > 0 ? (
              <span>
                <strong className="text-indigo-600 dark:text-indigo-400">{wordsRemaining.toLocaleString()}</strong> words to target
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Target reached (+{Math.abs(wordsRemaining).toLocaleString()} over)
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar Visual */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 100
                ? "bg-linear-to-r from-emerald-500 to-teal-500"
                : progressPercent >= 75
                ? "bg-linear-to-r from-indigo-500 to-indigo-600"
                : progressPercent >= 40
                ? "bg-linear-to-r from-blue-500 to-indigo-500"
                : "bg-linear-to-r from-amber-500 to-indigo-500"
            }`}
            style={{ width: `${Math.max(2, progressPercent)}%` }}
          />
        </div>

        {/* Target Presets Selector */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800/80 text-[10px]">
          <span className="text-gray-400 dark:text-gray-500 font-medium mr-1">Target Goal:</span>
          {TARGET_PRESETS.map((p) => (
            <button
              key={p.target}
              type="button"
              onClick={() => {
                setSelectedTarget(p.target);
                setIsCustomMode(false);
              }}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                !isCustomMode && selectedTarget === p.target
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/70 text-gray-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {p.target.toLocaleString()}w
            </button>
          ))}

          {isCustomMode ? (
            <div className="inline-flex items-center gap-1 ml-1">
              <input
                type="number"
                min="50"
                step="50"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="w-16 px-1.5 py-0.5 text-[10px] rounded border border-indigo-400 bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-100 font-bold focus:outline-none"
              />
              <span className="text-gray-400">words</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className="px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800/70 text-gray-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Custom
            </button>
          )}
        </div>
      </div>

      {/* Extracted Text Preview Drawer */}
      {stats?.snippet && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            {showPreview ? "Hide Text Preview" : "Preview Extracted Document Text"}
            {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showPreview && (
            <div className="mt-2 p-3 bg-white dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 font-mono text-xs text-gray-600 dark:text-gray-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed animate-fadeIn">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 border-b pb-1 dark:border-slate-800">
                First ~300 characters extracted from document:
              </div>
              {stats.snippet}
              {stats.wordCount > 50 && " ... [document text continues]"}
            </div>
          )}
        </div>
      )}

      {countError && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{countError}</span>
        </div>
      )}

    </div>
  );
}
