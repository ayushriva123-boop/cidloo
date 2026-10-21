import React, { useState, useEffect } from "react";
import {
  Search,
  ShieldCheck,
  Edit3,
  FileText,
  Trash2,
  RotateCcw,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Sliders,
  X,
  Save,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Copy,
  Check,
  Cpu,
  Calendar,
  User,
  HardDrive,
  FileDown,
  Loader2,
} from "lucide-react";
import { PlagiarismResult } from "../types";
import { downloadPdfReport } from "../utils/pdfGenerator";

export interface SubmissionLogItem {
  id: string;
  submissionId: string;
  paperId: string;
  title: string;
  authorName: string;
  submittedBy: string;
  documentType: string;
  submissionDate: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  wordCount: number;
  charCount: number;
  pageCount: number;
  plagiarismScore: number;
  originalityScore: number;
  aiScore: number;
  originalScores?: {
    plagiarismScore: number;
    originalityScore: number;
    aiScore: number;
  };
  isManuallyEdited: boolean;
  lastEditedAt?: string;
  editedBy?: string;
  adminNotes?: string;
  analysisSummary: string;
  matchedSources?: any[];
  suspiciousSections?: any[];
  fullText?: string;
  storedFilePath?: string;
  result?: PlagiarismResult;
}

interface AdminPortalProps {
  adminToken: string;
  adminUser: { username: string; role: string };
  onLogout: () => void;
  onBackToScanner: () => void;
  onViewReport: (result: PlagiarismResult) => void;
}

export default function AdminPortal({
  adminToken,
  adminUser,
  onLogout,
  onBackToScanner,
  onViewReport,
}: AdminPortalProps) {
  const [submissions, setSubmissions] = useState<SubmissionLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "edited" | "high_sim" | "high_ai">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SubmissionLogItem | null>(null);
  const [editSimScore, setEditSimScore] = useState<number>(0);
  const [editAiScore, setEditAiScore] = useState<number>(0);
  const [editOrigScore, setEditOrigScore] = useState<number>(100);
  const [autoSyncOrig, setAutoSyncOrig] = useState<boolean>(true);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Original Document Viewer State
  const [viewingDoc, setViewingDoc] = useState<SubmissionLogItem | null>(null);
  const [docFullText, setDocFullText] = useState<string>("");
  const [isLoadingDocText, setIsLoadingDocText] = useState<boolean>(false);
  const [docSearchQuery, setDocSearchQuery] = useState<string>("");
  const [docFontSize, setDocFontSize] = useState<"sm" | "base" | "lg">("base");
  const [isCopiedDocText, setIsCopiedDocText] = useState<boolean>(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  // Fetch all submission logs from the server
  const fetchSubmissions = async (query = searchQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = query.trim()
        ? `/api/admin/submissions?search=${encodeURIComponent(query.trim())}`
        : "/api/admin/submissions";

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Admin session expired. Please log in again.");
        }
        throw new Error("Failed to load submissions logs from server.");
      }

      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      console.error("Error fetching admin logs:", err);
      setError(err.message || "Failed to connect to admin API.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubmissions(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchSubmissions("");
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: SubmissionLogItem) => {
    setEditingItem(item);
    setEditSimScore(item.plagiarismScore);
    setEditAiScore(item.aiScore);
    setEditOrigScore(item.originalityScore);
    setAutoSyncOrig(item.plagiarismScore + item.originalityScore === 100);
    setAdminNotes(item.adminNotes || "");
    setSaveSuccessMsg(null);
  };

  const handleCloseEditModal = () => {
    setEditingItem(null);
    setSaveSuccessMsg(null);
  };

  // Open Original Document Viewer
  const handleOpenOriginalDoc = async (item: SubmissionLogItem) => {
    setViewingDoc(item);
    setDocSearchQuery("");
    setIsCopiedDocText(false);

    if (item.fullText) {
      setDocFullText(item.fullText);
      setIsLoadingDocText(false);
    } else {
      setIsLoadingDocText(true);
      try {
        const res = await fetch(`/api/admin/submissions/${item.paperId}/original-document`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDocFullText(data.fullText || "Original document text not available.");
        } else {
          setDocFullText("Could not load original document text.");
        }
      } catch {
        setDocFullText("Error connecting to server to fetch original document.");
      } finally {
        setIsLoadingDocText(false);
      }
    }
  };

  const handleCloseOriginalDoc = () => {
    setViewingDoc(null);
    setDocFullText("");
  };

  // Download the user's original uploaded document
  const handleDownloadOriginalDoc = async (paperId: string, fileName: string) => {
    setDownloadingDocId(paperId);
    try {
      const res = await fetch(`/api/admin/submissions/${paperId}/download-original`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (!res.ok) {
        throw new Error("Original file not available on server.");
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(err.message || "Failed to download original document.");
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Copy full document text
  const handleCopyDocText = () => {
    if (!docFullText) return;
    navigator.clipboard.writeText(docFullText);
    setIsCopiedDocText(true);
    setTimeout(() => setIsCopiedDocText(false), 2000);
  };

  // When Similarity Match is changed, auto-update Originality if synced
  const handleSimScoreChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setEditSimScore(clamped);
    if (autoSyncOrig) {
      setEditOrigScore(100 - clamped);
    }
  };

  // Save manual edits to server
  const handleSaveEdits = async () => {
    if (!editingItem) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/submissions/${editingItem.paperId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          plagiarismScore: editSimScore,
          aiScore: editAiScore,
          originalityScore: editOrigScore,
          adminNotes: adminNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update submission scores.");
      }

      // Update in local state
      setSubmissions((prev) =>
        prev.map((sub) => (sub.paperId === editingItem.paperId ? data.submission : sub))
      );

      setSaveSuccessMsg("Scores successfully updated and saved to logs!");
      setTimeout(() => {
        handleCloseEditModal();
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Failed to save edits.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to original detected values
  const handleResetScores = async (paperId: string) => {
    if (!confirm("Are you sure you want to reset this paper back to its original AI detected scores?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/reset-scores/${paperId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset scores.");
      }

      setSubmissions((prev) =>
        prev.map((sub) => (sub.paperId === paperId ? data.submission : sub))
      );
    } catch (err: any) {
      alert(err.message || "Failed to reset scores.");
    }
  };

  // Delete submission log
  const handleDeleteSubmission = async (paperId: string) => {
    if (!confirm(`Are you sure you want to permanently delete submission #${paperId}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/submissions/${paperId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete submission.");
      }

      setSubmissions((prev) => prev.filter((s) => s.paperId !== paperId));
    } catch (err: any) {
      alert(err.message || "Failed to delete submission.");
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download PDF audit report directly from log item
  const handleDownloadItemPdf = (item: SubmissionLogItem) => {
    if (item.result) {
      downloadPdfReport(item.result);
    } else {
      // Reconstitute standard PlagiarismResult
      const resultObj: PlagiarismResult = {
        plagiarismScore: item.plagiarismScore,
        originalityScore: item.originalityScore,
        aiScore: item.aiScore,
        analysisSummary: item.analysisSummary,
        matchedSources: item.matchedSources || [],
        suspiciousSections: item.suspiciousSections || [],
        reportDate: item.submissionDate,
        documentStats: {
          fileName: item.fileName,
          fileSize: item.fileSize,
          fileType: item.fileType,
          wordCount: item.wordCount,
          charCount: item.charCount,
          pageCount: item.pageCount,
        },
        submissionInfo: {
          authorName: item.authorName,
          title: item.title,
          paperId: item.paperId,
          submittedBy: item.submittedBy,
          submissionDate: item.submissionDate,
          documentType: item.documentType,
          excludeQuotes: true,
          excludeBibliography: true,
          excludeSmallSources: true,
          dbStudentPapers: true,
          dbJournalsPublishers: true,
          dbInternetWeb: true,
          dbInstitutionRepository: true,
        },
      };
      downloadPdfReport(resultObj);
    }
  };

  // Inspect / View report in main app
  const handleInspectReport = (item: SubmissionLogItem) => {
    if (item.result) {
      onViewReport(item.result);
    } else {
      const resultObj: PlagiarismResult = {
        plagiarismScore: item.plagiarismScore,
        originalityScore: item.originalityScore,
        aiScore: item.aiScore,
        analysisSummary: item.analysisSummary,
        matchedSources: item.matchedSources || [],
        suspiciousSections: item.suspiciousSections || [],
        reportDate: item.submissionDate,
        documentStats: {
          fileName: item.fileName,
          fileSize: item.fileSize,
          fileType: item.fileType,
          wordCount: item.wordCount,
          charCount: item.charCount,
          pageCount: item.pageCount,
        },
        submissionInfo: {
          authorName: item.authorName,
          title: item.title,
          paperId: item.paperId,
          submittedBy: item.submittedBy,
          submissionDate: item.submissionDate,
          documentType: item.documentType,
          excludeQuotes: true,
          excludeBibliography: true,
          excludeSmallSources: true,
          dbStudentPapers: true,
          dbJournalsPublishers: true,
          dbInternetWeb: true,
          dbInstitutionRepository: true,
        },
      };
      onViewReport(resultObj);
    }
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (activeFilter === "edited") return sub.isManuallyEdited;
    if (activeFilter === "high_sim") return sub.plagiarismScore >= 20;
    if (activeFilter === "high_ai") return sub.aiScore >= 40;
    return true;
  });

  // Calculate quick stats
  const totalSubmissions = submissions.length;
  const manuallyEditedCount = submissions.filter((s) => s.isManuallyEdited).length;
  const avgSimilarity =
    totalSubmissions > 0
      ? Math.round(submissions.reduce((acc, s) => acc + s.plagiarismScore, 0) / totalSubmissions)
      : 0;
  const avgAiScore =
    totalSubmissions > 0
      ? Math.round(submissions.reduce((acc, s) => acc + s.aiScore, 0) / totalSubmissions)
      : 0;

  // Search match highlight helper
  const renderHighlightedDocumentText = () => {
    if (!docFullText) {
      return <p className="italic text-gray-400">No text content available.</p>;
    }

    if (!docSearchQuery.trim()) {
      return (
        <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 leading-relaxed select-text">
          {docFullText}
        </pre>
      );
    }

    const query = docSearchQuery.trim();
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = docFullText.split(regex);

    return (
      <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 leading-relaxed select-text">
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-amber-300 dark:bg-amber-500/40 text-gray-900 dark:text-amber-100 font-bold px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </pre>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* 1. Admin Header Bar (Clean, no admin personal details displayed) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-150 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Admin Console
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Document Audit & Calibration Workspace
                </span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mt-1">
                Admin Console & Submission Logs
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Search submission IDs, inspect and download original submitted documents, and calibrate Similarity Match, AI Content, and Originality Index.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToScanner}
              className="px-4 py-2.5 rounded-xl border border-gray-250 dark:border-slate-750 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Scanner</span>
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* 2. Admin Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-gray-150 dark:border-slate-800">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Total Submissions</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {totalSubmissions}
            </div>
            <span className="text-[10px] text-gray-400">Recorded across all users</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-gray-150 dark:border-slate-800">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Avg Similarity Match</span>
              <Percent className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {avgSimilarity}%
            </div>
            <span className="text-[10px] text-gray-400">Standard detected baseline</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-gray-150 dark:border-slate-800">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Avg AI Content Match</span>
              <Cpu className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {avgAiScore}%
            </div>
            <span className="text-[10px] text-gray-400">GenAI detection probability</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-gray-150 dark:border-slate-800">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Admin Calibrated</span>
              <Sliders className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {manuallyEditedCount}
            </div>
            <span className="text-[10px] text-gray-400">Manually customized papers</span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Submission ID (e.g. SUB-5498454), Paper ID, Document Title, or Author..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-250 dark:border-slate-800 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all dark:text-gray-100 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer shrink-0"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => fetchSubmissions()}
            className="p-3 rounded-2xl border border-gray-250 dark:border-slate-750 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-150 dark:border-slate-800">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
            Filter View:
          </span>
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            }`}
          >
            All Logs ({submissions.length})
          </button>

          <button
            onClick={() => setActiveFilter("edited")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "edited"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Admin Overridden ({manuallyEditedCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter("high_sim")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "high_sim"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            }`}
          >
            Similarity ≥ 20%
          </button>

          <button
            onClick={() => setActiveFilter("high_ai")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "high_ai"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            }`}
          >
            AI Content ≥ 40%
          </button>
        </div>
      </div>

      {/* 4. Submissions Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
              Recorded Submissions & Audit History
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {filteredSubmissions.length} of {submissions.length} total logged papers • Click "Original Doc" to see or download raw user document
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-sm font-bold text-gray-500">Loading audit records from database...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3 text-rose-500">
            <AlertTriangle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={() => fetchSubmissions()}
              className="px-4 py-2 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
            <h4 className="text-sm font-black text-gray-700 dark:text-gray-300">
              No submissions found
            </h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchQuery
                ? `No submissions matched your search "${searchQuery}". Check the Submission ID or clear the search filter.`
                : "No submissions recorded in the log yet. When users submit papers in the scanner, they will appear here."}
            </p>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-gray-150 dark:border-slate-800 text-gray-400 uppercase font-black tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Submission / Paper ID</th>
                  <th className="py-3.5 px-4">Document & Author</th>
                  <th className="py-3.5 px-4">Stats & Date</th>
                  <th className="py-3.5 px-4 text-center">Similarity Match %</th>
                  <th className="py-3.5 px-4 text-center">AI Content %</th>
                  <th className="py-3.5 px-4 text-center">Originality Index %</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-slate-800 font-medium">
                {filteredSubmissions.map((sub) => {
                  const isSimHigh = sub.plagiarismScore > 20;
                  const isAiHigh = sub.aiScore > 50;

                  return (
                    <tr
                      key={sub.paperId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors"
                    >
                      {/* ID Column */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1 items-start">
                          <button
                            onClick={() => handleCopyId(sub.paperId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                            title="Click to copy Paper ID"
                          >
                            <span>#{sub.paperId}</span>
                            {copiedId === sub.paperId ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {sub.submissionId}
                          </span>
                        </div>
                      </td>

                      {/* Document & Author */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <div className="font-extrabold text-gray-900 dark:text-gray-100 line-clamp-1 text-xs">
                          {sub.title || sub.fileName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {sub.fileType || "DOC"}
                          </span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                            {sub.authorName}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">
                          {sub.submittedBy || "System direct"}
                        </div>
                      </td>

                      {/* Stats & Date */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="text-gray-800 dark:text-gray-200 font-mono text-[11px]">
                          {sub.wordCount.toLocaleString()} words · {sub.pageCount} {sub.pageCount === 1 ? "page" : "pages"}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>{sub.submissionDate}</span>
                        </div>
                      </td>

                      {/* Similarity Match % */}
                      <td className="py-4 px-4 align-top text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-3 py-1 rounded-xl font-black text-xs font-mono shadow-xs ${
                              isSimHigh
                                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                                : sub.plagiarismScore > 10
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            }`}
                          >
                            {sub.plagiarismScore}%
                          </span>
                          {sub.originalScores && sub.isManuallyEdited && (
                            <span className="text-[9px] text-gray-400 line-through mt-0.5">
                              orig: {sub.originalScores.plagiarismScore}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AI Content Detection % */}
                      <td className="py-4 px-4 align-top text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-3 py-1 rounded-xl font-black text-xs font-mono shadow-xs ${
                              isAiHigh
                                ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                            }`}
                          >
                            {sub.aiScore}%
                          </span>
                          {sub.originalScores && sub.isManuallyEdited && (
                            <span className="text-[9px] text-gray-400 line-through mt-0.5">
                              orig: {sub.originalScores.aiScore}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Originality Index % */}
                      <td className="py-4 px-4 align-top text-center">
                        <span className="px-3 py-1 rounded-xl font-black text-xs font-mono bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-xs">
                          {sub.originalityScore}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top text-center">
                        {sub.isManuallyEdited ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                              <Edit3 className="w-2.5 h-2.5" />
                              Calibrated
                            </span>
                            <span className="text-[9px] text-gray-400 mt-0.5">
                              Manual Override
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 flex items-center gap-1 justify-center">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                            Auto Verified
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 1. View Original Document */}
                          <button
                            onClick={() => handleOpenOriginalDoc(sub)}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold flex items-center gap-1 transition-colors cursor-pointer border border-sky-200/70 dark:border-sky-800/60"
                            title="See and inspect original document text and full content"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>See Doc</span>
                          </button>

                          {/* 2. Download Original Document File */}
                          <button
                            onClick={() => handleDownloadOriginalDoc(sub.paperId, sub.fileName)}
                            disabled={downloadingDocId === sub.paperId}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer border border-gray-250 dark:border-slate-700 disabled:opacity-50"
                            title={`Download original uploaded document file (${sub.fileName})`}
                          >
                            {downloadingDocId === sub.paperId ? (
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                            ) : (
                              <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </button>

                          {/* 3. Manual Score Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(sub)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1 transition-colors cursor-pointer border border-indigo-200/70 dark:border-indigo-800/60"
                            title="Manually edit Similarity, AI Content, and Originality Index"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Edit Scores</span>
                          </button>

                          {/* 4. Inspect Audit Report in App */}
                          <button
                            onClick={() => handleInspectReport(sub)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Full Plagiarism Audit Report in App"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 5. Download Official PDF Report */}
                          <button
                            onClick={() => handleDownloadItemPdf(sub)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Download PDF Audit Report (with score badges & QR verification)"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* 6. Reset button if edited */}
                          {sub.isManuallyEdited && (
                            <button
                              onClick={() => handleResetScores(sub.paperId)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                              title="Reset back to original AI detected values"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 7. Delete */}
                          <button
                            onClick={() => handleDeleteSubmission(sub.paperId)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Submission Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. ORIGINAL DOCUMENT VIEWER MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-150 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-950/50">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      Original Document
                    </span>
                    <span className="font-mono text-xs text-gray-400">
                      ID: #{viewingDoc.paperId}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100 mt-1 line-clamp-1">
                    {viewingDoc.title || viewingDoc.fileName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {viewingDoc.fileName} • Submitted by {viewingDoc.authorName} ({viewingDoc.submittedBy})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Download Original File Button */}
                <button
                  onClick={() => handleDownloadOriginalDoc(viewingDoc.paperId, viewingDoc.fileName)}
                  disabled={downloadingDocId === viewingDoc.paperId}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  title="Download the exact original user uploaded file"
                >
                  {downloadingDocId === viewingDoc.paperId ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download Original File</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCloseOriginalDoc}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Metadata Badges */}
            <div className="px-6 py-3 bg-slate-100/60 dark:bg-slate-950/40 border-b border-gray-150 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-gray-500 dark:text-gray-400">Format:</span>
                <strong className="text-gray-900 dark:text-gray-100 font-mono">
                  {viewingDoc.fileType} ({(viewingDoc.fileSize / 1024).toFixed(1)} KB)
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-500 shrink-0" />
                <span className="text-gray-500 dark:text-gray-400">Total Words:</span>
                <strong className="text-gray-900 dark:text-gray-100 font-mono">
                  {viewingDoc.wordCount.toLocaleString()}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="text-gray-500 dark:text-gray-400">Pages:</span>
                <strong className="text-gray-900 dark:text-gray-100 font-mono">
                  ~{viewingDoc.pageCount} {viewingDoc.pageCount === 1 ? "page" : "pages"}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-gray-500 dark:text-gray-400">Date:</span>
                <strong className="text-gray-900 dark:text-gray-100 truncate text-[11px]">
                  {viewingDoc.submissionDate}
                </strong>
              </div>
            </div>

            {/* Document Reader Controls Toolbar */}
            <div className="px-6 py-2.5 border-b border-gray-150 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 text-xs">
              {/* In-document Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  placeholder="Find in document..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-250 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 focus:outline-none dark:text-gray-100 font-medium"
                />
                {docSearchQuery && (
                  <button
                    onClick={() => setDocSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Font Size Selector */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setDocFontSize("sm")}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      docFontSize === "sm" ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600" : "text-gray-500"
                    }`}
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setDocFontSize("base")}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      docFontSize === "base" ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600" : "text-gray-500"
                    }`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setDocFontSize("lg")}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      docFontSize === "lg" ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600" : "text-gray-500"
                    }`}
                  >
                    A+
                  </button>
                </div>

                {/* Copy Text Button */}
                <button
                  onClick={handleCopyDocText}
                  className="px-3 py-1.5 rounded-xl border border-gray-250 dark:border-slate-750 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isCopiedDocText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Document Content Body */}
            <div
              className={`p-6 sm:p-8 overflow-y-auto flex-1 bg-white dark:bg-slate-900 ${
                docFontSize === "sm" ? "text-xs" : docFontSize === "lg" ? "text-base" : "text-sm"
              }`}
            >
              {isLoadingDocText ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
                  <p className="text-sm font-bold text-gray-500">Retrieving original document content...</p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto border border-gray-100 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 bg-slate-50/40 dark:bg-slate-950/30 font-sans shadow-inner">
                  {renderHighlightedDocumentText()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-150 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-mono">
                {docFullText ? `${docFullText.split(/\s+/).filter(Boolean).length} total words rendered` : ""}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadOriginalDoc(viewingDoc.paperId, viewingDoc.fileName)}
                  disabled={downloadingDocId === viewingDoc.paperId}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Document ({viewingDoc.fileType})</span>
                </button>
                <button
                  onClick={handleCloseOriginalDoc}
                  className="px-4 py-2 rounded-xl border border-gray-250 dark:border-slate-750 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. EDIT SCORES MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative space-y-6 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseEditModal}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Manual Metric Calibration
                </span>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                  Edit Submission Scores
                </h3>
              </div>
            </div>

            {/* Document Context Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-extrabold text-gray-900 dark:text-gray-100 truncate">
                {editingItem.title}
              </div>
              <div className="text-gray-500 text-[11px]">
                Author: <strong className="text-gray-700 dark:text-gray-300">{editingItem.authorName}</strong> • Paper ID: #{editingItem.paperId}
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* 3 Core Editors requested by User: Similarity Match %, AI Content Detection %, Originality Index % */}
            <div className="space-y-5">
              {/* 1. Similarity Match % */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Similarity Match % (Plagiarism)</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editSimScore}
                      onChange={(e) => handleSimScoreChange(Number(e.target.value))}
                      className="w-16 px-2 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono font-black text-sm text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <span className="font-black text-xs text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editSimScore}
                  onChange={(e) => handleSimScoreChange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>0% (Completely Unique)</span>
                  <span>100% (Full Plagiarism)</span>
                </div>
              </div>

              {/* 2. AI Content Detection % */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-500" />
                    <span>AI Content Detection %</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editAiScore}
                      onChange={(e) =>
                        setEditAiScore(Math.max(0, Math.min(100, Math.round(Number(e.target.value)))))
                      }
                      className="w-16 px-2 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono font-black text-sm text-purple-600 dark:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                    <span className="font-black text-xs text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editAiScore}
                  onChange={(e) => setEditAiScore(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>0% (Human Authored)</span>
                  <span>100% (Generative AI)</span>
                </div>
              </div>

              {/* 3. Originality Index % */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span>Originality Index %</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={autoSyncOrig}
                      value={editOrigScore}
                      onChange={(e) =>
                        setEditOrigScore(Math.max(0, Math.min(100, Math.round(Number(e.target.value)))))
                      }
                      className="w-16 px-2 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono font-black text-sm text-teal-600 dark:text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60"
                    />
                    <span className="font-black text-xs text-gray-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  disabled={autoSyncOrig}
                  value={editOrigScore}
                  onChange={(e) => setEditOrigScore(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer disabled:opacity-50"
                />
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-gray-600 dark:text-gray-400 font-medium">
                    <input
                      type="checkbox"
                      checked={autoSyncOrig}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAutoSyncOrig(checked);
                        if (checked) {
                          setEditOrigScore(100 - editSimScore);
                        }
                      }}
                      className="rounded accent-indigo-600"
                    />
                    <span>Auto-sync with Similarity (100 - Similarity)</span>
                  </label>
                </div>
              </div>

              {/* Admin Note field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Admin Audit Reason / Note (Optional)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Verified by academic department; manual calibration applied"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 text-xs bg-white dark:bg-slate-950 focus:border-indigo-500 focus:outline-none dark:text-gray-100 font-medium"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveEdits}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Scores (Admin)"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
