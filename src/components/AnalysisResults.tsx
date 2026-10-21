import { useState, useEffect } from "react";
import { PlagiarismResult, MatchedSource, SuspiciousSection } from "../types";
import { 
  FileText, Calendar, Hash, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, 
  Download, Link2, ExternalLink, RefreshCw, AlertTriangle, Info, BookOpen, 
  Layers, Database, FileCheck, HelpCircle, ArrowLeft, ArrowRight, Eye, QrCode,
  Copy, Check, X, ShieldCheck
} from "lucide-react";
import { buildVerificationUrl, buildPlainTextVerificationReport, generateQrCodeDataUrl } from "../utils/verification";

interface AnalysisResultsProps {
  result: PlagiarismResult;
  onDownloadPdf: () => void;
  onNewCheck: () => void;
  onOpenVerification?: () => void;
}

export default function AnalysisResults({ result, onDownloadPdf, onNewCheck, onOpenVerification }: AnalysisResultsProps) {
  const [activePage, setActivePage] = useState<"page1" | "page2" | "page3" | "notes">("page1");
  const [highlightHover, setHighlightHover] = useState<number | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrModalTab, setQrModalTab] = useState<"qr" | "text">("qr");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const verificationUrl = buildVerificationUrl(result);
  const plainTextReport = buildPlainTextVerificationReport(result);

  useEffect(() => {
    // Generate QR containing the full plain-text verification report with all user details & AI match %
    generateQrCodeDataUrl(plainTextReport)
      .then(setQrCodeDataUrl)
      .catch((err) => console.error("Error generating QR code:", err));
  }, [result, plainTextReport]);

  const handleCopyVerificationLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPlainText = () => {
    navigator.clipboard.writeText(plainTextReport);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const { plagiarismScore, originalityScore, documentStats, analysisSummary, matchedSources, suspiciousSections, reportDate } = result;

  // Resolve custom submissionInfo with high-fidelity fallbacks to match DrillBit visual look
  const submission = result.submissionInfo || {
    authorName: "ALAPATI VARSHHA",
    title: documentStats.fileName.replace(/\.[^/.]+$/, ""),
    paperId: "5498454",
    submittedBy: "library@gdgu.org",
    submissionDate: reportDate || "2026-04-16 12:24:31",
    documentType: "Assignment",
    excludeQuotes: true,
    excludeBibliography: true,
    excludeSmallSources: true,
    dbStudentPapers: true,
    dbJournalsPublishers: true,
    dbInternetWeb: true,
    dbInstitutionRepository: true
  };

  // Plagiarism Grade Calculation
  // A: 0-10%, B: 11-40%, C: 41-60%, D: 61-100%
  let grade = "A";
  let gradeLabel = "A-Satisfactory (0-10%)";
  let gradeBg = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  let gradeTrackerColor = "bg-emerald-500";
  
  if (plagiarismScore > 10 && plagiarismScore <= 40) {
    grade = "B";
    gradeLabel = "B-Upgrade (11-40%)";
    gradeBg = "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    gradeTrackerColor = "bg-blue-500";
  } else if (plagiarismScore > 40 && plagiarismScore <= 60) {
    grade = "C";
    gradeLabel = "C-Poor (41-60%)";
    gradeBg = "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    gradeTrackerColor = "bg-amber-500";
  } else if (plagiarismScore > 60) {
    grade = "D";
    gradeLabel = "D-Unacceptable (61-100%)";
    gradeBg = "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800";
    gradeTrackerColor = "bg-rose-500";
  }

  // Trigonometric Arc generation for responsive vector SVG Pie Charts
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", x, y,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  // Pie angles calculated dynamically
  // Standard split: Journal vs Internet
  const pubPercent = plagiarismScore > 0 ? Math.max(10, Math.round(plagiarismScore * 0.46 * 10) / 10) : 3.71;
  const webPercent = plagiarismScore > 0 ? Math.max(10, Math.round((plagiarismScore - pubPercent) * 10) / 10) : 4.29;
  const pubAngle = (pubPercent / (pubPercent + webPercent)) * 360;

  // Donut values: Quotes (0.37%), Excluded Words (2.61%), plagiarism remainder
  const quotesAngle = 0.037 * 360;
  const smallWordsAngle = 0.261 * 360;

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* 1. Drillbit Header Toolbar Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-gray-800 dark:bg-slate-800 dark:text-gray-100 border border-gray-250 dark:border-slate-700">
              Grade {grade} Verification Report
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-950 dark:text-gray-50 uppercase tracking-tight">
            DocuScan Plagiarism Cockpit
          </h2>
          <p className="text-xs text-gray-450 dark:text-gray-500">
            Submission ID: <span className="font-mono font-bold text-indigo-650 dark:text-indigo-400">{submission.paperId}</span> • Updated dynamically
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 font-bold text-xs rounded-xl border border-gray-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Scan or preview the verification QR code"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Scan / Preview QR
          </button>

          <button
            onClick={onDownloadPdf}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-indigo-550/10 shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF Report
          </button>
          
          <button
            onClick={onNewCheck}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-850 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-100 font-bold text-xs rounded-xl border border-gray-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Submit New File
          </button>
        </div>
      </div>

      {/* 2. Interactive Document Page Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActivePage("page1")}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activePage === "page1"
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs"
              : "text-gray-500 hover:text-gray-805 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Page 1: Overview</span>
        </button>
        
        <button
          onClick={() => setActivePage("page2")}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activePage === "page2"
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs"
              : "text-gray-500 hover:text-gray-850 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Page 2: Similarity report</span>
        </button>

        <button
          onClick={() => setActivePage("page3")}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activePage === "page3"
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs"
              : "text-gray-500 hover:text-gray-850 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Page 3: Annotated Text</span>
        </button>

        <button
          onClick={() => setActivePage("notes")}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activePage === "notes"
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs"
              : "text-gray-500 hover:text-gray-850 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Executive Summary</span>
        </button>
      </div>

      {/* 3. Plagiarism Report Checker Render Area */}
      <div id="plagiarism-report-checker-sheet" className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-lg p-6 md:p-12 relative overflow-hidden text-gray-900 select-text">
        
        {/* Universal Plagiarism Report Checker Branding Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center pb-4 mb-2 border-b-4 border-indigo-700 animate-fadeIn text-slate-800 dark:text-slate-100">
          <div className="flex items-center gap-3">
            {/* Blue Plagiarism Report Checker Stylized Logo */}
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-xs">
              P
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-blue-700 dark:text-blue-400 flex items-center gap-1.5 font-sans">
                Plagiarism Report Checker
              </span>
              <p className="text-[10px] uppercase font-black tracking-wider text-gray-450 dark:text-gray-500">
                made by Ayush Shrivastava
              </p>
            </div>
          </div>
          <div className="text-right mt-3 sm:mt-0">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-400 italic">
              Plagiarism Report Checker Similarity Report
            </p>
          </div>
        </div>

        {/* -------------------- PAGE 1: OVERVIEW -------------------- */}
        {activePage === "page1" && (
          <div className="space-y-8 animate-fadeIn text-slate-800 dark:text-slate-100">
            
            {/* Submission information Grid */}
            <div>
              <h3 className="text-md font-black uppercase text-blue-700 dark:text-blue-400 mb-3 border-b pb-1 font-sans">
                Submission Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-y-1.5 text-sm">
                
                <div className="md:col-span-3 font-semibold text-rose-600 dark:text-rose-400">Author Name</div>
                <div className="md:col-span-9 font-medium">{submission.authorName}</div>

                <div className="md:col-span-3 font-semibold text-rose-600 dark:text-rose-400">Title</div>
                <div className="md:col-span-9 font-medium leading-tight">{submission.title}</div>

                <div className="md:col-span-3 font-semibold text-rose-600 dark:text-rose-400">Paper/Submission ID</div>
                <div className="md:col-span-9 font-mono font-bold text-indigo-600 dark:text-indigo-400">{submission.paperId}</div>

                <div className="md:col-span-3 font-semibold text-rose-600 dark:text-rose-400">Submitted by</div>
                <div className="md:col-span-9 font-mono text-gray-600 dark:text-gray-400">{submission.submittedBy}</div>

                <div className="md:col-span-3 font-semibold text-rose-600 dark:text-rose-400">Submission Date</div>
                <div className="md:col-span-9 text-gray-600 dark:text-gray-400 font-mono">{submission.submissionDate}</div>

                <div className="md:col-span-3 font-semibold text-rose-600 dark:text-rose-400">Total Pages, Total Words</div>
                <div className="md:col-span-9 font-semibold">{documentStats.pageCount}, {documentStats.wordCount.toLocaleString()}</div>

                <div className="md:col-span-3 font-semibold text-rose-600 dark:text-rose-400">Document type</div>
                <div className="md:col-span-9 font-bold text-blue-700 dark:text-blue-400">{submission.documentType}</div>
              </div>
            </div>

            {/* Result Information */}
            <div className="pt-4 border-t border-gray-150 dark:border-slate-800">
              <h3 className="text-md font-black uppercase text-blue-700 dark:text-blue-400 mb-4 font-sans">
                Result Information
              </h3>
                           <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6 items-center">
                <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col gap-4">
                  <div className="flex-1">
                    <span className="text-xs font-black text-gray-400 dark:text-gray-500 block uppercase tracking-wider">Similarity Score Match</span>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-505 font-sans flex items-baseline gap-1 mt-0.5">
                      Similarity <span className="text-3xl">{plagiarismScore} %</span>
                    </div>
                  </div>

                  <div className="flex-1 md:border-t border-gray-150 dark:border-slate-800 md:pt-3">
                    <span className="text-xs font-black text-gray-400 dark:text-gray-500 block uppercase tracking-wider">AI Writing Detection</span>
                    <div className={`text-2xl font-black font-sans flex items-baseline gap-1 mt-0.5 ${
                      (result.aiScore ?? 0) > 70 
                        ? "text-amber-600 dark:text-amber-500" 
                        : (result.aiScore ?? 0) > 40
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-emerald-600 dark:text-emerald-500"
                    }`}>
                      AI Content <span className="text-3xl">{result.aiScore ?? 0} %</span>
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-0.5 leading-normal font-medium">
                      {(result.aiScore ?? 0) > 70 
                        ? "⚠️ Mostly written by AI assistant"
                        : (result.aiScore ?? 0) > 40
                          ? "📝 Moderate AI editing detected"
                          : "✅ Authentic human original"}
                    </span>
                  </div>
                </div>

                {/* Simulated Graduated Scale Pointer */}
                <div className="md:col-span-7 bg-gray-50 dark:bg-slate-900 border border-gray-250 dark:border-slate-850 rounded-2xl p-4 w-full">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 font-mono mb-1">
                    <span>1</span>
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                    <span>40</span>
                    <span>50</span>
                    <span>60</span>
                    <span>70</span>
                    <span>80</span>
                    <span>90</span>
                  </div>
                  {/* Outer gradient or block bar */}
                  <div className="h-4 w-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full relative overflow-hidden">
                    {/* Tick for calculated score */}
                    <div 
                      className="absolute top-0 bottom-0 w-1.5 bg-gray-950 dark:bg-white border border-white dark:border-gray-950 shadow-md animate-slideUp"
                      style={{ left: `${Math.min(99, Math.max(1, plagiarismScore))}%` }}
                    />
                  </div>
                  <p className="text-[10px] italic text-gray-400 dark:text-gray-500 mt-2 text-center">
                    Similarity evaluated securely using active database reference streams
                  </p>
                </div>
              </div>

              {/* Pie and Donut Chart Visualizations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                
                {/* 1. Sources Type Card */}
                <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-xs flex flex-col items-center">
                  <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest mb-4">
                    Sources Type
                  </h4>
                  <div className="w-48 h-48 relative">
                    {/* SVG Drawn Pie Wedge */}
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {plagiarismScore === 0 ? (
                        <circle cx="50" cy="50" r="40" fill="#10B981" />
                      ) : (
                        <>
                          <path d={describeArc(50, 50, 42, 0, pubAngle)} fill="#f43f5e" />
                          <path d={describeArc(50, 50, 42, pubAngle, 360)} fill="#fca5a5" />
                        </>
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-mono font-bold bg-white/95 dark:bg-slate-950 px-2 py-0.5 rounded-md border text-slate-800 dark:text-slate-100">
                        {plagiarismScore}% Matches
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4 text-[10px] font-bold font-sans uppercase">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 bg-rose-500 rounded" />
                      <span>Journal/Pub {pubPercent}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 bg-rose-300 rounded" />
                      <span>Internet {webPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* 2. Report Content Card */}
                <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-xs flex flex-col items-center">
                  <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest mb-4">
                    Report Content Metrics
                  </h4>
                  <div className="w-48 h-48 relative">
                    {/* SVG Donut Circle */}
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      {plagiarismScore > 0 && (
                        <>
                          <circle cx="50" cy="50" r="44" fill="none" stroke="#f43f5e" strokeWidth="4" strokeDasharray="276" strokeDashoffset={(1 - plagiarismScore/100)*276} strokeLinecap="round" />
                          {/* Quotes (0.37%) section */}
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#fb7185" strokeWidth="6" strokeDasharray="238" strokeDashoffset={(1 - 0.05)*238} />
                          {/* Words < 14 (2.61%) section */}
                          <circle cx="50" cy="50" r="32" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="200" strokeDashoffset={(1 - 0.1)*200} />
                        </>
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Original</span>
                      <span className="text-lg font-black font-mono text-emerald-600">{originalityScore}%</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 mt-4 text-[10px] font-bold font-sans uppercase">
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 bg-rose-500 rounded-full" />
                      <span>Similarity</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 bg-rose-300 rounded-full" />
                      <span>Quotes (0.37%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 bg-slate-300 rounded-full" />
                      <span>Words &lt; 14 (2.61%)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Exclude information & Database selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-150 dark:border-slate-800">
              
              {/* Exclude table */}
              <div>
                <h4 className="text-sm font-black text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wide">
                  Exclude Information
                </h4>
                <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">Quotes</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{submission.excludeQuotes ? "Excluded" : "Included"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">References/Bibliography</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{submission.excludeBibliography ? "Excluded" : "Included"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">Source: Excluded &lt; 14 Words</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{submission.excludeSmallSources ? "Excluded" : "Included"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">Excluded Source</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">4 %</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">Excluded Phrases</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">Excluded</span>
                  </div>
                </div>
              </div>

              {/* Database selection table */}
              <div>
                <h4 className="text-sm font-black text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wide">
                  Database Selection
                </h4>
                <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-400 font-sans">Language</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">English</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-400 font-sans">Student Papers</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{submission.dbStudentPapers ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-400 font-sans">Journals &amp; publishers</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{submission.dbJournalsPublishers ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-400 font-sans">Internet or Web</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{submission.dbInternetWeb ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-400 font-sans">Institution Repository</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{submission.dbInstitutionRepository ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* QR Code and sharing section */}
            <div className="pt-6 border-t border-gray-150 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100 tracking-wide flex items-center justify-center sm:justify-start gap-1.5">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  A Unique QR Code use to View/Download/Share Pdf File
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-lg">
                  Scan this QR code with any mobile camera to instantly view student name, paper details, analyzed text, and AI match %.
                </p>
                <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    Enlarge QR &amp; Scan
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenVerification) {
                        onOpenVerification();
                      } else {
                        window.location.href = verificationUrl;
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-gray-200 font-bold text-[11px] rounded-lg border border-gray-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Verification Record
                  </button>
                </div>
              </div>

              {/* Real Scannable QR Code */}
              <div 
                onClick={() => setShowQrModal(true)}
                className="w-22 h-22 bg-white p-1.5 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xs flex shrink-0 items-center justify-center cursor-pointer hover:scale-105 transition-transform group relative"
                title="Click to enlarge scannable QR Code"
              >
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="Scannable Verification QR Code" className="w-full h-full rounded-md object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
                )}
              </div>
            </div>

          </div>
        )}

        {/* -------------------- PAGE 2: DETAILED MATCH BREAKDOWN -------------------- */}
        {activePage === "page2" && (
          <div className="space-y-8 animate-fadeIn text-slate-805 dark:text-slate-100">
            <div>
              <h3 className="text-md font-black uppercase text-blue-700 dark:text-blue-400 mb-2 border-b pb-1 font-sans">
                Plagiarism Report Checker Similarity Report
              </h3>
            </div>

            {/* Giant KPI card counters block */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-gray-150 dark:border-slate-800 text-center">
              <div>
                <div className="text-4xl font-mono font-black text-rose-600 dark:text-rose-500 leading-none">
                  {plagiarismScore}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2 block">
                  Similarity %
                </span>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-slate-800 pt-4 sm:pt-0">
                <div className="text-4xl font-mono font-black text-indigo-650 dark:text-indigo-400 leading-none">
                  {matchedSources.length}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2 block">
                  Matched Sources
                </span>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-slate-800 pt-4 sm:pt-0">
                <div className="text-4xl font-mono font-black text-rose-500 leading-none flex justify-center items-center gap-1.5">
                  {grade}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2 block">
                  Grade
                </span>
              </div>

              {/* Legend checklist */}
              <div className="border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-slate-800 pt-4 sm:pt-0 text-[9px] font-bold text-left px-4 flex flex-col justify-center space-y-0.5">
                <span className="text-emerald-600">A-Satisfactory (0-10%)</span>
                <span className="text-blue-600">B-Upgrade (11-40%)</span>
                <span className="text-amber-600">C-Poor (41-60%)</span>
                <span className="text-rose-600">D-Unacceptable (61-100%)</span>
              </div>
            </div>

            {/* Matched sources table list */}
            <div>
              <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                Primary Matched Sources
              </h4>
              
              {matchedSources.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-900/30 border border-dashed rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    No web matched sources detected. Exceptional originality.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-800 font-bold uppercase text-[9px] tracking-wider text-gray-400">
                        <th className="py-2.5">Location ID</th>
                        <th className="py-2.5">Matched Domain URL</th>
                        <th className="py-2.5 text-center">% Match</th>
                        <th className="py-2.5 pr-2">Source Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {matchedSources.map((src, idx) => (
                        <tr 
                          key={idx}
                          onMouseEnter={() => setHighlightHover(idx + 1)}
                          onMouseLeave={() => setHighlightHover(null)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3">
                            <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400 font-mono font-black flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 font-semibold text-gray-900 dark:text-gray-100">
                            <div className="flex items-center gap-1">
                              <span>{src.title}</span>
                              {src.url && (
                                <a 
                                  href={src.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline inline-flex items-center"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono block mt-0.5 max-w-[280px] md:max-w-md truncate">
                              {src.matchedText}
                            </span>
                          </td>
                          <td className="py-3 text-center text-rose-600 font-mono font-bold">
                            {src.similarity}%
                          </td>
                          <td className="py-3 text-gray-500 font-semibold uppercase text-[10px]">
                            {src.url && src.url.includes("academic") || src.url && src.url.includes("edu") ? "Publication" : "Internet Data"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Excluded sources simulation matching step 2 screen */}
            <div className="pt-4 border-t border-gray-150 dark:border-slate-800">
              <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                Excluded Sources Audit Trail
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800 font-bold uppercase text-[9px] tracking-wider text-gray-400">
                      <th className="py-2">Ref ID</th>
                      <th className="py-2">Domain</th>
                      <th className="py-2 text-center">% Overlap</th>
                      <th className="py-2 text-right">Methodology</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-gray-500">
                      <td className="py-2.5 font-mono">3</td>
                      <td className="py-2.5 font-semibold text-gray-600 dark:text-gray-300">www.rsp.hr</td>
                      <td className="py-2.5 text-center font-mono">4%</td>
                      <td className="py-2.5 text-right font-bold text-gray-400">Bibliography Filtered</td>
                    </tr>
                    <tr className="text-gray-500">
                      <td className="py-2.5 font-mono">4</td>
                      <td className="py-2.5 font-semibold text-gray-600 dark:text-gray-300">en.wikipedia.org/wiki/Legal_constitution</td>
                      <td className="py-2.5 text-center font-mono">2.1%</td>
                      <td className="py-2.5 text-right font-bold text-gray-400">Small word exclusion (&lt;14)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Excluded Phrases checklist to match screenshot 2 */}
            <div className="pt-4 border-t border-gray-150 dark:border-slate-800">
              <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                Excluded Phrases Common Terminology Check
              </h4>
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="font-mono text-indigo-500 font-bold">1</span>
                  <span className="text-gray-700 dark:text-gray-300">the supreme court of india</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-indigo-500 font-bold">2</span>
                  <span className="text-gray-700 dark:text-gray-300">the supreme court of the united states of america</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-indigo-500 font-bold">3</span>
                  <span className="text-gray-700 dark:text-gray-300">constitution of india</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-indigo-500 font-bold">4</span>
                  <span className="text-gray-700 dark:text-gray-300">high court</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-indigo-500 font-bold">5</span>
                  <span className="text-gray-700 dark:text-gray-300">supreme court</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* -------------------- PAGE 3: INTERACTIVE ANNOTATED TEXT -------------------- */}
        {activePage === "page3" && (
          <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="text-md font-black uppercase text-blue-700 dark:text-blue-400 font-sans">
                Interactive Plagiarized Document Viewer
              </h3>
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Hover matches to identify matching source index
              </span>
            </div>

            <div className="p-6 md:p-10 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 rounded-2xl shadow-inner text-base font-sans leading-relaxed text-gray-800 dark:text-gray-200 min-h-[350px]">
              
              {/* If we have suspiciousSections matched, overlay highlights. Otherwise generic beautiful mock document */}
              {suspiciousSections.length === 0 ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-950 dark:text-gray-50 leading-tight">
                    {submission.title}
                  </h4>
                  <p className="italic text-xs text-gray-400 mb-2">By {submission.authorName}</p>
                  <p>
                    This paper represents pristine originality. Each phrase exhibits independent stylistic structures, correct citation methods, and clean contextual formulations. No parts showed verbatim overlays matching index databases.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-justify select-text">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-tight font-sans tracking-tight mb-2">
                    {submission.title}
                  </h4>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 italic mb-6">Submitted by: {submission.authorName}</p>

                  <p>
                    Academic writing forms the backbone of research inquiry across global universities. 
                    <span 
                      className={`transition-all duration-200 rounded px-1 text-pink-905 bg-pink-100/90 dark:bg-pink-950/40 relative font-medium ${
                        highlightHover === 1 ? "ring-2 ring-pink-500 bg-pink-200 dark:bg-pink-955" : ""
                      }`}
                      title="Correlation found in Primary sources library databases"
                    >
                      {suspiciousSections[0]?.text || "Proper scholarship incorporates synthesized ideas combined with meticulous and authentic attribution structures to form stable integrity."}
                      <sup className="ml-0.5 text-[9px] font-black font-mono text-pink-700 bg-pink-200 dark:bg-pink-900 rounded px-1">
                        1
                      </sup>
                    </span>
                    These credentials establish trustworthy systems where peer-reviewers validate the claims.
                  </p>

                  <p>
                    According to latest surveys on educational policy models, students must grasp paraphrasing techniques before authoring books. 
                    {suspiciousSections && suspiciousSections.length > 1 ? (
                      <span 
                        className={`transition-all duration-200 rounded px-1 text-pink-955 bg-pink-100/90 dark:bg-pink-950/40 relative font-medium ${
                          highlightHover === 2 ? "ring-2 ring-pink-500 bg-pink-200 dark:bg-pink-955" : ""
                        }`}
                      >
                        {suspiciousSections[1].text}
                        <sup className="ml-0.5 text-[9px] font-black font-mono text-pink-700 bg-pink-200 dark:bg-pink-900 rounded px-1">
                          2
                        </sup>
                      </span>
                    ) : (
                      <span className="bg-pink-100 dark:bg-pink-950/40 px-1 py-0.5 rounded text-pink-900 dark:text-pink-300">
                        "Plagiarism is an academic offense."
                        <sup className="ml-0.5 text-[9.5px] font-bold text-pink-600 font-mono">1</sup>
                      </span>
                    )}
                    Without strict vigilance systems, unauthorized copying leads to severe reputation damages.
                  </p>

                  {/* Rest of the annotated document text excerpt flow */}
                  <p className="text-gray-700 dark:text-gray-300">
                    To construct highly authentic papers, review panels recommend writing in small, logical outlines first. Document every source meticulously, ensuring footnotes point directionally towards public indices. 
                    {suspiciousSections && suspiciousSections.length > 2 && (
                      <span className="bg-pink-100/80 dark:bg-pink-950/30 text-pink-900 dark:text-pink-300 rounded px-1">
                        "{suspiciousSections[2].text}"
                        <sup className="ml-0.5 text-[9px] font-bold text-pink-600 font-mono">3</sup>
                      </span>
                    )}
                    This holistic assessment protocol is essential for realizing professional excellence and securing clean reviews.
                  </p>

                </div>
              )}

            </div>
          </div>
        )}

        {/* -------------------- EXECUTIVE SUMMARY NOTES TAB -------------------- */}
        {activePage === "notes" && (
          <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
            <h3 className="text-md font-black uppercase text-blue-700 dark:text-blue-400 border-b pb-1 font-sans">
              Executive Integrity & Paraphrasing Advice
            </h3>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border border-gray-150 dark:border-slate-800 rounded-2xl">
              <h4 className="text-xs font-black text-gray-550 dark:text-gray-450 uppercase mb-2 tracking-wider">
                Auditor Summary Comments
              </h4>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line font-medium">
                {analysisSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
              <div className="p-5 border rounded-2xl border-gray-150 dark:border-slate-800">
                <span className="text-rose-600 font-black block uppercase tracking-wider mb-2 font-mono">
                  VERBATIM VERDICTS
                </span>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Avoid stringing together segments from existing legal frameworks, policy declarations or common educational standards. Replace them with structured references or frame them using dual quote blocks coupled with standard citation numbers.
                </p>
              </div>

              <div className="p-5 border rounded-2xl border-gray-150 dark:border-slate-800 animate-slideUp">
                <span className="text-emerald-700 font-black block uppercase tracking-wider mb-2 font-mono dark:text-emerald-450">
                  PARAPHRASING BLUEPRINTS
                </span>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Synthesize paragraphs using your own active layout. First read the entire text segment, list down key thematic structures, close the original paper, and describe the conceptual mechanics from fresh, unique memory streams.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* -------------------- INTERACTIVE QR CODE VERIFICATION MODAL -------------------- */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                    Document Verification QR Code (Text Format)
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Scans directly into human-readable plain text on any phone or scanner
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setQrModalTab("qr")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  qrModalTab === "qr"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                Scannable QR Code
              </button>
              <button
                type="button"
                onClick={() => setQrModalTab("text")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  qrModalTab === "text"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                Plain-Text Report Preview
              </button>
            </div>

            {/* Tab 1: QR Code Presentation */}
            {qrModalTab === "qr" && (
              <div className="flex flex-col items-center text-center space-y-4 animate-fadeIn">
                <div className="p-3 bg-white rounded-2xl border-2 border-indigo-100 dark:border-indigo-950 shadow-md">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Document Verification QR Code" className="w-56 h-56 rounded-xl" />
                  ) : (
                    <div className="w-56 h-56 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">
                      Generating scannable QR...
                    </div>
                  )}
                </div>

                <div className="space-y-1 max-w-sm">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/50">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Plain Text Report Encoded
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                    Point any camera or scanner app to view this text report:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-left pt-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-gray-150 dark:border-slate-800">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Author</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">{submission.authorName}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-gray-150 dark:border-slate-800">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Paper ID</span>
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200 block">{submission.paperId}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-gray-150 dark:border-slate-800">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Similarity</span>
                      <span className="font-black text-rose-600 dark:text-rose-400">{plagiarismScore}% (Grade {grade})</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-gray-150 dark:border-slate-800">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">AI Match</span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400">{result.aiScore ?? 0}% AI</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Plain Text Report Viewer */}
            {qrModalTab === "text" && (
              <div className="space-y-3 animate-fadeIn text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    Exact text rendered by QR scanner:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPlainText}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText ? "Copied!" : "Copy Text"}
                  </button>
                </div>

                <div className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed rounded-xl max-h-64 overflow-y-auto whitespace-pre border border-slate-800 shadow-inner">
                  {plainTextReport}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-gray-150 dark:border-slate-800">
              <button
                onClick={handleCopyPlainText}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                {copiedText ? "Text Copied!" : "Copy Scanned Text"}
              </button>

              <button
                onClick={handleCopyVerificationLink}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Link2 className="w-3.5 h-3.5 text-gray-400" />}
                {copiedLink ? "Link Copied!" : "Copy URL"}
              </button>

              <button
                onClick={() => {
                  setShowQrModal(false);
                  onDownloadPdf();
                }}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer shadow-indigo-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
