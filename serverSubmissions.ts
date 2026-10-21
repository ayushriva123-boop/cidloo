import fs from "fs";
import path from "path";

export interface SubmissionRecord {
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
  originalScores: {
    plagiarismScore: number;
    originalityScore: number;
    aiScore: number;
  };
  isManuallyEdited: boolean;
  lastEditedAt?: string;
  editedBy?: string;
  adminNotes?: string;
  analysisSummary: string;
  matchedSources: Array<{
    title: string;
    url?: string;
    similarity: number;
    matchedText: string;
  }>;
  suspiciousSections: Array<{
    text: string;
    reason: string;
    sourceName: string;
    severity: "high" | "medium" | "low";
  }>;
  fullText?: string;
  storedFilePath?: string;
  result: any;
}

const DATA_DIR = path.join(process.cwd(), "data");
export const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
export const DOCUMENTS_DIR = path.join(DATA_DIR, "documents");

// In-memory cache
let submissionsCache: SubmissionRecord[] = [];
let isInitialized = false;

// Seed documents full texts
const SEED_TEXT_1 = `HOW CAN SOFT SKILLS AND SOCIAL CAPITAL FOSTER RESILIENCE IN CONTEMPORARY ORGANIZATIONS?

Author: ALAPATI VARSHHA
Institution: GD Goenka University
Document Type: Assignment / Empirical Study

ABSTRACT:
In the contemporary volatile economic and organizational environment, human agility and adaptive capabilities serve as key differentiators of long-term sustainable performance. Soft skills and social capital foster resilience in dynamic organizational environments through shared values, psychological safety, and horizontal interpersonal networks. This research investigates the dual interplay between intrapersonal emotional competencies (emotional intelligence, active listening, stress regulation) and structural relational ties (trust networks, cross-functional collaboration, mentor dyads). Using a mixed-method case review of 120 professionals, the analysis indicates that individuals with elevated emotional maturity and dense social connectivity experience 43% faster recovery periods following operational setbacks.

1. INTRODUCTION & CONCEPTUAL FOUNDATIONS
The concept of resilience in organizational behavior has evolved from a passive defensive capacity into an active generative capability. While technological infrastructure and financial buffers provide foundational shock absorption, social ties and interpersonal communications act as the vital circulatory system during crises. Soft skills represent personal non-cognitive attributes that facilitate collaborative problem-solving, whereas social capital refers to the resources embedded within personal and professional networks.

2. THE MECHANISM OF INTERPERSONAL TRUST
Trust networks lower communication friction and enable rapid information transfer. When team members operate in an atmosphere of psychological safety, error reporting occurs without punitive stigma, allowing teams to diagnose systemic issues earlier.

3. METHODOLOGY & EMPIRICAL FINDINGS
A randomized sample across service and technology sectors was analyzed. Regression modeling confirms significant positive correlation between communicative competence, network centrality, and adaptive resilience indicators (p < 0.01).

4. CONCLUSION & RECOMMENDATIONS
Organizations must prioritize continuous soft skills enrichment alongside technical domain competencies. Fostering organic internal affinity circles, peer mentorship, and transparent dialogue creates an anti-fragile collective infrastructure capable of weathering strategic disruptions.`;

const SEED_TEXT_2 = `DEEP NEURAL ARCHITECTURES FOR MULTILINGUAL NATURAL LANGUAGE PROCESSING

Author: Dr. Rohan Mehrotra
Department of Computer Science and Engineering, IIT Delhi
Document Type: Dissertation / Doctoral Thesis

ABSTRACT:
Cross-lingual transfer learning has emerged as a cornerstone for extending modern computational linguistic capabilities to low-resource vernacular dialects. Transformer attention mechanisms exhibit parameter-efficient cross-lingual transfer learning across tokenized corpora by leveraging shared multilingual subword embeddings and contextual latent spaces. In this dissertation, we introduce PolyGlotNet, a 24-layer bidirectional encoder with adaptive cross-attention gates explicitly calibrated for phonetic and morphological nuances in Indic and Indo-Aryan language families. We benchmark our model against mBERT and XLM-RoBERTa across 14 Indic languages, demonstrating an average improvement of 4.8 BLEU points in machine translation and 6.2 F1 points in named entity recognition.

1. BACKGROUND AND THEORETICAL PRELIMINARIES
Traditional monolingual language representations require separate parameter spaces for each dialect, incurring prohibitive compute and annotation overheads. Recent advancements in self-supervised pre-training across unaligned multilingual datasets demonstrate that contextual encoders can project distinct typographical tokens into a unified geometric manifold.

2. PROPOSED ARCHITECTURE: POLYGLOTNET
PolyGlotNet introduces dynamic routing layers that condition attention projection weights on language identifier tokens. By decoupling shared semantic representations from language-specific morphological transformations, the model retains cross-lingual generalization while mitigating catastrophic forgetting.

3. EXPERIMENTAL SETUP & EVALUATION METRICS
Evaluation was conducted on standard benchmarks including Samanantar, IndicGLUE, and AI4Bharat corpora. Our pipeline utilized 8x NVIDIA A100 GPUs with mixed-precision FP16 training.

4. RESULTS AND DISCUSSION
Evaluation metrics on low-resource Indic languages demonstrates significant baseline improvements over prior state-of-the-art architectures, validating our hypothesis regarding language-specific modulation layers.`;

const SEED_TEXT_3 = `MICROBIAL FUEL CELLS FOR SUSTAINABLE WASTEWATER REMEDIATION AND BIOENERGY CONVERSION

Author: Priyanka Nair
Department of Biotechnology, University of Delhi
Document Type: Master's Thesis

ABSTRACT:
Microbial fuel cells (MFCs) offer a promising synergistic solution for simultaneous industrial wastewater purification and direct bioelectricity generation. Electrogenic bacteria and proton exchange membrane configuration in bioelectrochemical reactors dictate electrochemical conversion efficiency and chemical oxygen demand (COD) reduction rates. In this investigation, dual-chambered MFC systems were inoculated with anaerobic sludge collected from municipal treatment facilities and fed with synthetic dairy effluent. Under optimized hydrodynamic and resistive loading conditions, the system achieved a maximum power density of 480 mW/m² accompanied by an 89.4% COD removal efficiency over a 72-hour batch digestion cycle.

1. INTRODUCTION
Escalating industrialization has intensified the discharge of organic-rich effluents into natural freshwater bodies, posing severe ecological threats. Conventional aeration-based wastewater treatment requires substantial electrical power. Microbial fuel cells fundamentally reframe wastewater treatment from an energy-intensive burden into a decentralized power-generating opportunity.

2. ELECTROCHEMICAL DESIGN & MEMBRANE SELECTION
The experimental reactor utilized carbon cloth anodes modified with carbon nanotubes to enhance microbial biofilm adhesion and extracellular electron transfer rates. A Nafion 117 proton exchange membrane partitioned the anodic chamber from the ferricyanide-catalyzed cathode.

3. KINETICS OF BIOELECTROCHEMICAL REMEDIATION
Microbial consortia dominated by Geobacter and Shewanella species exhibited robust exoelectrogenic activity, maintaining continuous open-circuit voltages exceeding 650 mV. Cyclic voltammetry verified direct electron transfer mechanisms with minimal internal ohmic losses.

4. CONCLUSION
The demonstrated bioelectrochemical performance confirms the feasibility of scalable dual-purpose wastewater treatment reactors with net positive energy returns.`;

// Seed realistic initial logs so admin can immediately search, view original documents, and edit
const SEED_SUBMISSIONS: SubmissionRecord[] = [
  {
    id: "sub-seed-1",
    submissionId: "SUB-5498454",
    paperId: "5498454",
    title: "How Can Soft Skills and Social Capital Foster Resilience",
    authorName: "ALAPATI VARSHHA",
    submittedBy: "library@gdgu.org",
    documentType: "Assignment",
    submissionDate: "October 16, 2026, 04:32 PM",
    fileName: "Alapati_Varshha_Resilience_Research.docx",
    fileSize: 45892,
    fileType: "DOCX",
    wordCount: 1845,
    charCount: 11420,
    pageCount: 5,
    plagiarismScore: 8,
    originalityScore: 92,
    aiScore: 12,
    originalScores: {
      plagiarismScore: 8,
      originalityScore: 92,
      aiScore: 12,
    },
    isManuallyEdited: false,
    analysisSummary: "Low overall overlap detected. Primary matches originate from published academic journals on organizational behavior.",
    matchedSources: [
      {
        title: "Journal of Academic Psychology & Social Capital",
        similarity: 5,
        url: "https://journals.sagepub.com/doi/10.1177/0022146520984",
        matchedText: "soft skills and social capital foster resilience in dynamic organizational environments",
      },
      {
        title: "Higher Education Research Archive",
        similarity: 3,
        url: "https://www.sciencedirect.com/science/article/pii/S0147176722001",
        matchedText: "investigation into how adaptive personal competencies influence structural stability",
      },
    ],
    suspiciousSections: [
      {
        text: "Soft skills and social capital foster resilience in dynamic organizational environments.",
        reason: "Verbatim phrasing matches published abstract.",
        sourceName: "Journal of Academic Psychology & Social Capital",
        severity: "low",
      },
    ],
    fullText: SEED_TEXT_1,
    result: {
      plagiarismScore: 8,
      originalityScore: 92,
      aiScore: 12,
      analysisSummary: "Low overall overlap detected. Primary matches originate from published academic journals.",
      matchedSources: [
        {
          title: "Journal of Academic Psychology & Social Capital",
          similarity: 5,
          url: "https://journals.sagepub.com/doi/10.1177/0022146520984",
          matchedText: "soft skills and social capital foster resilience in dynamic organizational environments",
        },
      ],
      suspiciousSections: [
        {
          text: "Soft skills and social capital foster resilience in dynamic organizational environments.",
          reason: "Verbatim phrasing matches published abstract.",
          sourceName: "Journal of Academic Psychology & Social Capital",
          severity: "low",
        },
      ],
      reportDate: "October 16, 2026, 04:32 PM",
      documentStats: {
        fileName: "Alapati_Varshha_Resilience_Research.docx",
        fileSize: 45892,
        fileType: "DOCX",
        wordCount: 1845,
        charCount: 11420,
        pageCount: 5,
      },
      submissionInfo: {
        authorName: "ALAPATI VARSHHA",
        title: "How Can Soft Skills and Social Capital Foster Resilience",
        paperId: "5498454",
        submittedBy: "library@gdgu.org",
        submissionDate: "October 16, 2026, 04:32 PM",
        documentType: "Assignment",
        excludeQuotes: true,
        excludeBibliography: true,
        excludeSmallSources: true,
        dbStudentPapers: true,
        dbJournalsPublishers: true,
        dbInternetWeb: true,
        dbInstitutionRepository: true,
      },
    },
  },
  {
    id: "sub-seed-2",
    submissionId: "SUB-7823901",
    paperId: "7823901",
    title: "Deep Neural Architectures for Multilingual Natural Language Processing",
    authorName: "Dr. Rohan Mehrotra",
    submittedBy: "research.office@iitd.ac.in",
    documentType: "Dissertation",
    submissionDate: "October 17, 2026, 11:15 AM",
    fileName: "Rohan_NLP_Architectures_Thesis.pdf",
    fileSize: 128450,
    fileType: "PDF",
    wordCount: 4210,
    charCount: 28900,
    pageCount: 12,
    plagiarismScore: 19,
    originalityScore: 81,
    aiScore: 48,
    originalScores: {
      plagiarismScore: 19,
      originalityScore: 81,
      aiScore: 48,
    },
    isManuallyEdited: false,
    analysisSummary: "Moderate overlap detected in Section 2 (Literature Review). Algorithmic formulation sections are predominantly original.",
    matchedSources: [
      {
        title: "IEEE Transactions on Neural Networks",
        similarity: 11,
        url: "https://ieeexplore.ieee.org/document/9482710",
        matchedText: "Transformer attention mechanisms exhibit parameter-efficient cross-lingual transfer learning",
      },
      {
        title: "arXiv Computer Science Repository",
        similarity: 8,
        url: "https://arxiv.org/abs/2301.08920",
        matchedText: "evaluation metrics on low-resource Indic languages demonstrates significant baseline improvements",
      },
    ],
    suspiciousSections: [
      {
        text: "Transformer attention mechanisms exhibit parameter-efficient cross-lingual transfer learning across tokenized corpora.",
        reason: "Significant structural and lexical overlap with IEEE paper.",
        sourceName: "IEEE Transactions on Neural Networks",
        severity: "medium",
      },
    ],
    fullText: SEED_TEXT_2,
    result: {
      plagiarismScore: 19,
      originalityScore: 81,
      aiScore: 48,
      analysisSummary: "Moderate overlap detected in Section 2 (Literature Review).",
      matchedSources: [
        {
          title: "IEEE Transactions on Neural Networks",
          similarity: 11,
          url: "https://ieeexplore.ieee.org/document/9482710",
          matchedText: "Transformer attention mechanisms exhibit parameter-efficient cross-lingual transfer learning",
        },
      ],
      suspiciousSections: [
        {
          text: "Transformer attention mechanisms exhibit parameter-efficient cross-lingual transfer learning.",
          reason: "Significant structural and lexical overlap.",
          sourceName: "IEEE Transactions on Neural Networks",
          severity: "medium",
        },
      ],
      reportDate: "October 17, 2026, 11:15 AM",
      documentStats: {
        fileName: "Rohan_NLP_Architectures_Thesis.pdf",
        fileSize: 128450,
        fileType: "PDF",
        wordCount: 4210,
        charCount: 28900,
        pageCount: 12,
      },
      submissionInfo: {
        authorName: "Dr. Rohan Mehrotra",
        title: "Deep Neural Architectures for Multilingual Natural Language Processing",
        paperId: "7823901",
        submittedBy: "research.office@iitd.ac.in",
        submissionDate: "October 17, 2026, 11:15 AM",
        documentType: "Dissertation",
        excludeQuotes: true,
        excludeBibliography: true,
        excludeSmallSources: true,
        dbStudentPapers: true,
        dbJournalsPublishers: true,
        dbInternetWeb: true,
        dbInstitutionRepository: true,
      },
    },
  },
  {
    id: "sub-seed-3",
    submissionId: "SUB-6192843",
    paperId: "6192843",
    title: "Microbial Fuel Cells for Sustainable Wastewater Remediation",
    authorName: "Priyanka Nair",
    submittedBy: "pnair@biotech.du.ac.in",
    documentType: "Thesis",
    submissionDate: "October 18, 2026, 09:20 AM",
    fileName: "Microbial_Fuel_Cells_Remediation.pdf",
    fileSize: 95400,
    fileType: "PDF",
    wordCount: 3150,
    charCount: 21300,
    pageCount: 8,
    plagiarismScore: 4,
    originalityScore: 96,
    aiScore: 8,
    originalScores: {
      plagiarismScore: 4,
      originalityScore: 96,
      aiScore: 8,
    },
    isManuallyEdited: false,
    analysisSummary: "Exceptional originality. Only standard biological terminology and reagent definitions matched open public repositories.",
    matchedSources: [
      {
        title: "Bioresource Technology Reports",
        similarity: 4,
        url: "https://www.sciencedirect.com/journal/bioresource-technology-reports",
        matchedText: "electrogenic bacteria and proton exchange membrane configuration in bioelectrochemical reactors",
      },
    ],
    suspiciousSections: [
      {
        text: "Electrogenic bacteria and proton exchange membrane configuration in bioelectrochemical reactors.",
        reason: "Standard biochemical nomenclature overlap.",
        sourceName: "Bioresource Technology Reports",
        severity: "low",
      },
    ],
    fullText: SEED_TEXT_3,
    result: {
      plagiarismScore: 4,
      originalityScore: 96,
      aiScore: 8,
      analysisSummary: "Exceptional originality. High academic integrity score.",
      matchedSources: [
        {
          title: "Bioresource Technology Reports",
          similarity: 4,
          url: "https://www.sciencedirect.com/journal/bioresource-technology-reports",
          matchedText: "electrogenic bacteria and proton exchange membrane configuration in bioelectrochemical reactors",
        },
      ],
      suspiciousSections: [],
      reportDate: "October 18, 2026, 09:20 AM",
      documentStats: {
        fileName: "Microbial_Fuel_Cells_Remediation.pdf",
        fileSize: 95400,
        fileType: "PDF",
        wordCount: 3150,
        charCount: 21300,
        pageCount: 8,
      },
      submissionInfo: {
        authorName: "Priyanka Nair",
        title: "Microbial Fuel Cells for Sustainable Wastewater Remediation",
        paperId: "6192843",
        submittedBy: "pnair@biotech.du.ac.in",
        submissionDate: "October 18, 2026, 09:20 AM",
        documentType: "Thesis",
        excludeQuotes: true,
        excludeBibliography: true,
        excludeSmallSources: true,
        dbStudentPapers: true,
        dbJournalsPublishers: true,
        dbInternetWeb: true,
        dbInstitutionRepository: true,
      },
    },
  },
];

// Ensure documents directory exists and write seed physical files if absent
function ensureSeedDocumentsExist() {
  try {
    if (!fs.existsSync(DOCUMENTS_DIR)) {
      fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
    }

    // Seed file 1
    const file1 = path.join(DOCUMENTS_DIR, "5498454_Alapati_Varshha_Resilience_Research.docx");
    if (!fs.existsSync(file1)) {
      fs.writeFileSync(file1, Buffer.from(SEED_TEXT_1, "utf-8"));
    }

    // Seed file 2
    const file2 = path.join(DOCUMENTS_DIR, "7823901_Rohan_NLP_Architectures_Thesis.pdf");
    if (!fs.existsSync(file2)) {
      fs.writeFileSync(file2, Buffer.from(SEED_TEXT_2, "utf-8"));
    }

    // Seed file 3
    const file3 = path.join(DOCUMENTS_DIR, "6192843_Microbial_Fuel_Cells_Remediation.pdf");
    if (!fs.existsSync(file3)) {
      fs.writeFileSync(file3, Buffer.from(SEED_TEXT_3, "utf-8"));
    }
  } catch (err) {
    console.error("[SubmissionsStore] Failed to create seed document files:", err);
  }
}

export function initSubmissionsStore() {
  if (isInitialized) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    ensureSeedDocumentsExist();

    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const raw = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
      submissionsCache = JSON.parse(raw);

      // Ensure fullText and storedFilePath are enriched on existing cached records
      let hasChanges = false;
      for (const seed of SEED_SUBMISSIONS) {
        const existing = submissionsCache.find((s) => s.paperId === seed.paperId);
        if (existing) {
          if (!existing.fullText && seed.fullText) {
            existing.fullText = seed.fullText;
            hasChanges = true;
          }
          if (!existing.storedFilePath) {
            const seedPath = path.join(DOCUMENTS_DIR, `${seed.paperId}_${seed.fileName}`);
            if (fs.existsSync(seedPath)) {
              existing.storedFilePath = seedPath;
              hasChanges = true;
            }
          }
        } else {
          submissionsCache.push(seed);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        persistSubmissions();
      }
    } else {
      submissionsCache = SEED_SUBMISSIONS.map((seed) => ({
        ...seed,
        storedFilePath: path.join(DOCUMENTS_DIR, `${seed.paperId}_${seed.fileName}`),
      }));
      persistSubmissions();
    }
  } catch (err) {
    console.error("[SubmissionsStore] Failed to initialize storage from disk, using fallback seed:", err);
    submissionsCache = [...SEED_SUBMISSIONS];
  }
  isInitialized = true;
}

function persistSubmissions() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissionsCache, null, 2), "utf-8");
  } catch (err) {
    console.error("[SubmissionsStore] Failed saving submissions to disk:", err);
  }
}

export function getAllSubmissions(searchQuery?: string): SubmissionRecord[] {
  initSubmissionsStore();
  if (!searchQuery || !searchQuery.trim()) {
    return submissionsCache;
  }

  const query = searchQuery.trim().toLowerCase();
  return submissionsCache.filter((sub) => {
    return (
      sub.submissionId.toLowerCase().includes(query) ||
      sub.paperId.toLowerCase().includes(query) ||
      sub.title.toLowerCase().includes(query) ||
      sub.authorName.toLowerCase().includes(query) ||
      sub.submittedBy.toLowerCase().includes(query) ||
      sub.fileName.toLowerCase().includes(query)
    );
  });
}

export function getSubmissionByPaperId(paperId: string): SubmissionRecord | undefined {
  initSubmissionsStore();
  return submissionsCache.find((s) => s.paperId === paperId || s.submissionId === paperId);
}

export function addSubmission(record: Omit<SubmissionRecord, "id" | "originalScores" | "isManuallyEdited">): SubmissionRecord {
  initSubmissionsStore();
  const newRecord: SubmissionRecord = {
    ...record,
    id: "sub-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6),
    originalScores: {
      plagiarismScore: record.plagiarismScore,
      originalityScore: record.originalityScore,
      aiScore: record.aiScore,
    },
    isManuallyEdited: false,
  };

  // Add to top of list
  submissionsCache.unshift(newRecord);
  persistSubmissions();
  return newRecord;
}

export function updateSubmissionScores(
  paperId: string,
  scores: {
    plagiarismScore: number;
    aiScore: number;
    originalityScore?: number;
    adminNotes?: string;
  },
  adminUsername: string = "Administrator"
): SubmissionRecord | null {
  initSubmissionsStore();
  const index = submissionsCache.findIndex((s) => s.paperId === paperId || s.submissionId === paperId);
  if (index === -1) {
    return null;
  }

  const existing = submissionsCache[index];
  const newPlag = Math.max(0, Math.min(100, Math.round(scores.plagiarismScore)));
  const newAi = Math.max(0, Math.min(100, Math.round(scores.aiScore)));
  const newOrig =
    scores.originalityScore !== undefined
      ? Math.max(0, Math.min(100, Math.round(scores.originalityScore)))
      : 100 - newPlag;

  // Update record fields
  existing.plagiarismScore = newPlag;
  existing.aiScore = newAi;
  existing.originalityScore = newOrig;
  existing.isManuallyEdited = true;
  existing.editedBy = adminUsername;
  existing.lastEditedAt = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (scores.adminNotes !== undefined) {
    existing.adminNotes = scores.adminNotes;
  }

  // Update embedded result object
  if (existing.result) {
    existing.result.plagiarismScore = newPlag;
    existing.result.aiScore = newAi;
    existing.result.originalityScore = newOrig;
  }

  persistSubmissions();
  return existing;
}

export function deleteSubmission(paperId: string): boolean {
  initSubmissionsStore();
  const initialLength = submissionsCache.length;
  submissionsCache = submissionsCache.filter((s) => s.paperId !== paperId && s.submissionId !== paperId);
  if (submissionsCache.length !== initialLength) {
    persistSubmissions();
    return true;
  }
  return false;
}

export function resetSubmissionScores(paperId: string): SubmissionRecord | null {
  initSubmissionsStore();
  const existing = submissionsCache.find((s) => s.paperId === paperId || s.submissionId === paperId);
  if (!existing || !existing.originalScores) {
    return null;
  }

  existing.plagiarismScore = existing.originalScores.plagiarismScore;
  existing.aiScore = existing.originalScores.aiScore;
  existing.originalityScore = existing.originalScores.originalityScore;
  existing.isManuallyEdited = false;
  existing.lastEditedAt = undefined;
  existing.editedBy = undefined;

  if (existing.result) {
    existing.result.plagiarismScore = existing.originalScores.plagiarismScore;
    existing.result.aiScore = existing.originalScores.aiScore;
    existing.result.originalityScore = existing.originalScores.originalityScore;
  }

  persistSubmissions();
  return existing;
}
