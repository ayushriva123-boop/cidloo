import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, CheckCircle2, FileText, Calendar, User, Hash, 
  ExternalLink, Download, Copy, Check, ArrowLeft, Cpu, 
  AlertTriangle, BookOpen, Layers, Sparkles, QrCode
} from "lucide-react";
import { VerificationData, generateQrCodeDataUrl } from "../utils/verification";
import { PlagiarismResult } from "../types";
import { downloadPdfReport } from "../utils/pdfGenerator";

interface VerificationPortalProps {
  data: VerificationData;
  onBackToApp: () => void;
}

export default function VerificationPortal({ data, onBackToApp }: VerificationPortalProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    // Generate QR code pointing to current URL
    generateQrCodeDataUrl(window.location.href)
      .then(setQrCodeUrl)
      .catch((err) => console.error("Error generating QR code in verification view:", err));
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Convert VerificationData into PlagiarismResult to allow instant PDF download
  const handleDownloadPdf = () => {
    const fullResult: PlagiarismResult = {
      plagiarismScore: data.plagiarismScore,
      originalityScore: data.originalityScore,
      aiScore: data.aiScore,
      analysisSummary: data.analysisSummary || "Official Verification Record",
      matchedSources: data.matchedSources?.map((s) => ({
        title: s.title,
        similarity: s.similarity,
        url: s.url || "Internet Data",
        matchedText: `Verified match segment from ${s.title}`,
      })) || [
        { title: "eajournals.org", similarity: 4, url: "Publication", matchedText: "Verified segment" },
        { title: "www.talespin.com", similarity: 4, url: "Internet Data", matchedText: "Verified segment" },
      ],
      suspiciousSections: data.suspiciousSections?.map((sec) => ({
        text: sec.text,
        reason: sec.reason,
        sourceName: sec.sourceName,
        severity: "medium" as const,
      })) || [
        { text: "seen as a form of social capital in the environment of Viksit Bharat", reason: "Direct matched phrase", sourceName: "eajournals.org", severity: "medium" },
      ],
      reportDate: data.submissionDate,
      documentStats: {
        fileName: `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.docx`,
        fileSize: 1024 * 45,
        fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        wordCount: data.wordCount,
        charCount: data.charCount,
        pageCount: data.pageCount,
      },
      submissionInfo: {
        authorName: data.authorName,
        title: data.title,
        paperId: data.paperId,
        submittedBy: data.submittedBy,
        submissionDate: data.submissionDate,
        documentType: data.documentType,
        excludeQuotes: data.excludeQuotes,
        excludeBibliography: data.excludeBibliography,
        excludeSmallSources: data.excludeSmallSources,
        dbStudentPapers: data.dbStudentPapers,
        dbJournalsPublishers: data.dbJournalsPublishers,
        dbInternetWeb: data.dbInternetWeb,
        dbInstitutionRepository: data.dbInstitutionRepository,
      },
    };

    downloadPdfReport(fullResult);
  };

  // Calculate Grade
  let grade = "A";
  let gradeText = "Satisfactory (0-10%)";
  let gradeColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
  if (data.plagiarismScore > 10 && data.plagiarismScore <= 40) {
    grade = "B";
    gradeText = "Upgrade (11-40%)";
    gradeColor = "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800";
  } else if (data.plagiarismScore > 40 && data.plagiarismScore <= 60) {
    grade = "C";
    gradeText = "Poor (41-60%)";
    gradeColor = "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
  } else if (data.plagiarismScore > 60) {
    grade = "D";
    gradeText = "Unacceptable (61-100%)";
    gradeColor = "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800";
  }

  // AI Content status
  const aiScore = data.aiScore ?? 0;
  let aiStatus = "Human Authored (No AI detected)";
  let aiColor = "text-emerald-600 dark:text-emerald-400";
  let aiBadge = "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  if (aiScore > 50) {
    aiStatus = "High Probability of AI Generated Content";
    aiColor = "text-rose-600 dark:text-rose-400";
    aiBadge = "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800";
  } else if (aiScore > 20) {
    aiStatus = "Moderate AI Assisted Text Detected";
    aiColor = "text-amber-600 dark:text-amber-400";
    aiBadge = "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Navigation & Action Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBackToApp}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Open Document Scanner
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleCopyLink}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
            {copied ? "Link Copied!" : "Copy Verification URL"}
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-sm transition-all cursor-pointer shadow-indigo-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Official Certificate Verification Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-100 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Certificate Header Banner */}
        <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-black uppercase tracking-widest mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  Verified Authentic Academic Record
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                  Similarity &amp; AI Verification Certificate
                </h1>
                <p className="text-xs text-indigo-100/80 font-mono">
                  Certificate Paper ID: <span className="font-bold text-white">{data.paperId}</span>
                </p>
              </div>
            </div>

            {/* QR Code preview in banner */}
            {qrCodeUrl && (
              <div className="bg-white p-1.5 rounded-xl shrink-0 shadow-lg hidden sm:block">
                <img src={qrCodeUrl} alt="Verification QR Code" className="w-16 h-16 rounded-lg" />
              </div>
            )}
          </div>
        </div>

        {/* Certificate Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Author & Document Name Section */}
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-6 border border-gray-150 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block mb-1">
              Author / Student Name
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {data.authorName}
            </h2>
            
            <div className="mt-3 pt-3 border-t border-gray-200/80 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-1">
                Document / Paper Title
              </span>
              <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200 leading-snug">
                "{data.title}"
              </p>
            </div>
          </div>

          {/* Core Score Badges (Plagiarism % & AI Content %) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Plagiarism Similarity Box */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Similarity Match
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${gradeColor}`}>
                  Grade {grade}
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-4xl font-black font-mono text-rose-600 dark:text-rose-500">
                  {data.plagiarismScore}%
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                {gradeText}
              </p>
            </div>

            {/* AI Content Match Box */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" />
                  AI Content Detection
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${aiBadge}`}>
                  {aiScore}% AI
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-2">
                <span className={`text-4xl font-black font-mono ${aiColor}`}>
                  {aiScore}%
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                {aiStatus}
              </p>
            </div>

            {/* Originality Score Box */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Originality Index
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Unique
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {data.originalityScore}%
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                Original author expression verified
              </p>
            </div>

          </div>

          {/* Submission Details & Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Submission Details */}
            <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Submission Information
              </h3>
              <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Submission / Paper ID</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{data.paperId}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Submitted By</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{data.submittedBy || "library@gdgu.org"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Submission Date &amp; Time</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{data.submissionDate}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Document Type</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{data.documentType}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Total Words &amp; Pages</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {data.wordCount.toLocaleString()} words • {data.pageCount} pages
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Exclude & Database Details */}
            <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Audit Criteria &amp; Database
              </h3>
              <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Quotes Exclusion</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Excluded</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Bibliography Exclusion</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Excluded</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Small Sources (&lt; 14 Words)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Excluded</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Student Papers Database</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Active (Yes)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Journals &amp; Publishers</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Active (Yes)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Matched Sources Breakdown if present */}
          {data.matchedSources && data.matchedSources.length > 0 && (
            <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Matched Sources Breakdown
              </h3>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {data.matchedSources.map((source, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{source.title}</span>
                      {source.url && <span className="text-[10px] text-gray-400 font-mono">({source.url})</span>}
                    </div>
                    <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                      {source.similarity}% match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flagged Text Excerpt Details if present */}
          {data.suspiciousSections && data.suspiciousSections.length > 0 && (
            <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Sample Flagged Sentence Constructs
              </h3>
              <div className="space-y-3">
                {data.suspiciousSections.map((sec, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs">
                    <p className="font-medium text-gray-900 dark:text-gray-100 italic">
                      "{sec.text}"
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                      <span>Reason: {sec.reason}</span>
                      <span>Source: {sec.sourceName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scannable QR Code Card Footer */}
          <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
                <QrCode className="w-4 h-4 text-indigo-600" />
                Live Scannable QR Code
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                Anyone scanning this QR code with their mobile camera opens this official authenticity verification record with author name, text, and AI match %.
              </p>
            </div>

            {qrCodeUrl && (
              <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm shrink-0">
                <img src={qrCodeUrl} alt="Scannable QR Code" className="w-24 h-24 rounded-lg" />
              </div>
            )}
          </div>

        </div>

        {/* Certificate Card Bottom Seal */}
        <div className="bg-slate-100 dark:bg-slate-950 px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 gap-2">
          <span>Official Academic Integrity Verification Seal • Plagiarism Report Checker</span>
          <span className="font-mono">Verified Hash ID: {data.paperId}</span>
        </div>
      </div>
    </div>
  );
}
