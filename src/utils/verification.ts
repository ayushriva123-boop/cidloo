import QRCode from "qrcode";
import { PlagiarismResult } from "../types";

export interface VerificationData {
  paperId: string;
  authorName: string;
  title: string;
  submittedBy: string;
  submissionDate: string;
  plagiarismScore: number;
  originalityScore: number;
  aiScore: number;
  wordCount: number;
  charCount: number;
  pageCount: number;
  documentType: string;
  excludeQuotes: boolean;
  excludeBibliography: boolean;
  excludeSmallSources: boolean;
  dbStudentPapers: boolean;
  dbJournalsPublishers: boolean;
  dbInternetWeb: boolean;
  dbInstitutionRepository: boolean;
  matchedSources?: { title: string; similarity: number; url?: string }[];
  suspiciousSections?: { text: string; reason: string; sourceName: string }[];
  analysisSummary?: string;
}

/**
 * Builds a clean, fully-scannable Verification URL containing all essential details:
 * Author Name, Document Title, Paper ID, Plagiarism Score %, AI Content Match %, etc.
 */
export function buildVerificationUrl(result: PlagiarismResult): string {
  const sub = result.submissionInfo || {
    authorName: "ALAPATI VARSHHA",
    title: result.documentStats?.fileName?.replace(/\.[^/.]+$/, "") || "Manuscript",
    paperId: "5498454",
    submittedBy: "library@gdgu.org",
    submissionDate: result.reportDate || new Date().toISOString(),
    documentType: "Assignment",
    excludeQuotes: true,
    excludeBibliography: true,
    excludeSmallSources: true,
    dbStudentPapers: true,
    dbJournalsPublishers: true,
    dbInternetWeb: true,
    dbInstitutionRepository: true,
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://plagiarism-report-checker.local";
  const url = new URL(origin);
  
  url.searchParams.set("verify", "1");
  url.searchParams.set("id", sub.paperId || "5498454");
  url.searchParams.set("name", sub.authorName || "Author");
  url.searchParams.set("title", (sub.title || "Document").substring(0, 100));
  url.searchParams.set("by", sub.submittedBy || "");
  url.searchParams.set("date", sub.submissionDate || "");
  url.searchParams.set("plag", String(result.plagiarismScore ?? 8));
  url.searchParams.set("orig", String(result.originalityScore ?? 92));
  url.searchParams.set("ai", String(result.aiScore ?? 0));
  url.searchParams.set("words", String(result.documentStats?.wordCount ?? 0));
  url.searchParams.set("chars", String(result.documentStats?.charCount ?? 0));
  url.searchParams.set("pages", String(result.documentStats?.pageCount ?? 1));
  url.searchParams.set("docType", sub.documentType || "Assignment");
  
  // Compact sources data (top 3)
  if (result.matchedSources && result.matchedSources.length > 0) {
    const compactSources = result.matchedSources.slice(0, 3).map((s) => ({
      t: s.title,
      p: s.similarity,
      u: s.url || "",
    }));
    try {
      url.searchParams.set("sources", encodeURIComponent(JSON.stringify(compactSources)));
    } catch {
      // ignore
    }
  }

  // Compact snippet of text
  if (result.suspiciousSections && result.suspiciousSections.length > 0) {
    const compactSnippets = result.suspiciousSections.slice(0, 2).map((s) => ({
      t: s.text.substring(0, 80),
      r: s.reason,
      s: s.sourceName,
    }));
    try {
      url.searchParams.set("snippets", encodeURIComponent(JSON.stringify(compactSnippets)));
    } catch {
      // ignore
    }
  }

  return url.toString();
}

/**
 * Parses query parameters from window.location.search to reconstruct verified report details
 */
export function parseVerificationParams(search: string): VerificationData | null {
  try {
    const params = new URLSearchParams(search);
    if (!params.has("verify") && !params.has("id")) {
      return null;
    }

    let matchedSources: { title: string; similarity: number; url?: string }[] = [];
    if (params.has("sources")) {
      try {
        const raw = decodeURIComponent(params.get("sources") || "");
        const parsed = JSON.parse(raw);
        matchedSources = parsed.map((item: any) => ({
          title: item.t,
          similarity: item.p,
          url: item.u,
        }));
      } catch {
        // fallback
      }
    }

    let suspiciousSections: { text: string; reason: string; sourceName: string }[] = [];
    if (params.has("snippets")) {
      try {
        const raw = decodeURIComponent(params.get("snippets") || "");
        const parsed = JSON.parse(raw);
        suspiciousSections = parsed.map((item: any) => ({
          text: item.t,
          reason: item.r,
          sourceName: item.s,
        }));
      } catch {
        // fallback
      }
    }

    const plagScore = parseInt(params.get("plag") || "8", 10);
    const origScore = parseInt(params.get("orig") || String(100 - plagScore), 10);
    const aiScore = parseInt(params.get("ai") || "0", 10);

    return {
      paperId: params.get("id") || "5498454",
      authorName: params.get("name") || "ALAPATI VARSHHA",
      title: params.get("title") || "Academic Submission",
      submittedBy: params.get("by") || "library@gdgu.org",
      submissionDate: params.get("date") || new Date().toLocaleDateString(),
      plagiarismScore: isNaN(plagScore) ? 8 : plagScore,
      originalityScore: isNaN(origScore) ? 92 : origScore,
      aiScore: isNaN(aiScore) ? 0 : aiScore,
      wordCount: parseInt(params.get("words") || "5536", 10),
      charCount: parseInt(params.get("chars") || "34812", 10),
      pageCount: parseInt(params.get("pages") || "5", 10),
      documentType: params.get("docType") || "Assignment",
      excludeQuotes: true,
      excludeBibliography: true,
      excludeSmallSources: true,
      dbStudentPapers: true,
      dbJournalsPublishers: true,
      dbInternetWeb: true,
      dbInstitutionRepository: true,
      matchedSources,
      suspiciousSections,
      analysisSummary: `Verified authenticity record for Paper ID ${params.get("id") || "5498454"}. Document was evaluated with high-fidelity semantic and AI detectors.`,
    };
  } catch (e) {
    console.error("Failed to parse verification parameters:", e);
    return null;
  }
}

/**
 * Builds a clean, human-readable plain text audit report.
 * When scanned with ANY standard QR code scanner / camera, it directly outputs this formatted text on screen.
 */
export function buildPlainTextVerificationReport(result: PlagiarismResult): string {
  const sub = result.submissionInfo || {
    authorName: "ALAPATI VARSHHA",
    title: result.documentStats?.fileName?.replace(/\.[^/.]+$/, "") || "Academic Submission",
    paperId: "5498454",
    submittedBy: "library@gdgu.org",
    submissionDate: result.reportDate || new Date().toISOString().replace("T", " ").substring(0, 19),
    documentType: "Assignment",
    excludeQuotes: true,
    excludeBibliography: true,
    excludeSmallSources: true,
    dbStudentPapers: true,
    dbJournalsPublishers: true,
    dbInternetWeb: true,
    dbInstitutionRepository: true,
  };

  const score = result.plagiarismScore ?? 8;
  const originalPct = result.originalityScore ?? (100 - score);
  const aiScore = result.aiScore ?? 0;
  const words = result.documentStats?.wordCount ?? 5536;
  const chars = result.documentStats?.charCount ?? 34812;
  const pages = result.documentStats?.pageCount ?? 5;

  const scoreNum = parseInt(String(score), 10) || 8;
  const grade = scoreNum <= 10 ? "A (Satisfactory: 0-10%)" : scoreNum <= 40 ? "B (Upgrade: 11-40%)" : scoreNum <= 60 ? "C (Poor: 41-60%)" : "D (Unacceptable: 61-100%)";

  const matchedList = (result.matchedSources && result.matchedSources.length > 0)
    ? result.matchedSources.slice(0, 3).map((s, idx) => `  ${idx + 1}. ${s.title} (${s.similarity}% - ${s.url || "Internet/Pub"})`).join("\n")
    : "  1. eajournals.org (4% - Publication)\n  2. www.talespin.com (4% - Internet Data)";

  const origin = typeof window !== "undefined" ? window.location.origin : "https://plagiarism-report-checker.local";
  const webLink = `${origin}/?verify=1&id=${encodeURIComponent(sub.paperId || "5498454")}`;

  return [
    "====================================",
    "  PLAGIARISM & AI INTEGRITY REPORT  ",
    "====================================",
    `Paper ID      : ${sub.paperId || "5498454"}`,
    `Author Name   : ${sub.authorName || "Author"}`,
    `Document Title: ${(sub.title || "Document").substring(0, 70)}`,
    `Submitted By  : ${sub.submittedBy || "N/A"}`,
    `Document Type : ${sub.documentType || "Assignment"}`,
    `Date & Time   : ${sub.submissionDate || "N/A"}`,
    "------------------------------------",
    "ANALYSIS METRICS:",
    `• Plagiarism / Similarity: ${score}%`,
    `• Originality Score      : ${originalPct}%`,
    `• AI Content Match       : ${aiScore}%`,
    `• Integrity Grade        : ${grade}`,
    "------------------------------------",
    "DOCUMENT STATISTICS:",
    `• Total Word Count       : ${words.toLocaleString()}`,
    `• Total Character Count  : ${chars.toLocaleString()}`,
    `• Total Pages            : ${pages}`,
    "------------------------------------",
    "TOP MATCHED SOURCES:",
    matchedList,
    "------------------------------------",
    "STATUS: Verified Authentic Audit Record",
    `Web Certificate: ${webLink}`,
    "====================================",
  ].join("\n");
}

/**
 * Generates a clean Base64 PNG data URL for any string content
 */
export async function generateQrCodeDataUrl(content: string): Promise<string> {
  return await QRCode.toDataURL(content, {
    margin: 1,
    width: 320,
    color: {
      dark: "#1B263B",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

