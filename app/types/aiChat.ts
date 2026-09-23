// Типы ИИ-чата на клиенте (зеркало server/utils/ai/chatTypes.ts)

export interface AiAgentStep {
  step: number;
  thought: string;
  action: string;
  input?: any;
  output?: any;
  ms?: number;
}

export interface AiCertificateItem {
  id: string;
  certificateNumber: string;
  studentId?: string;
  studentName: string;
  courseName: string;
  issueDate?: string;
  expiryDate?: string;
  status?: string;
  organization?: string;
  hasPdf?: boolean;
}

export interface AiStudentCard {
  id: string;
  fullName: string;
  pinfl: string;
  organization: string;
  department: string;
  position: string;
  birthDate?: string;
  hasPhoto: boolean;
  photoUrl: string | null;
  confidence: number;
  groups: Array<{ id: string; code: string; courseName: string; startDate?: string; endDate?: string; isActive: boolean }>;
  groupsCount: number;
  certificates: AiCertificateItem[];
  certificatesCount: number;
}

export type AiChartType = "bar" | "hbar" | "line" | "area" | "doughnut" | "pie";

export interface AiReportArtifact {
  title: string;
  description?: string;
  columns: Array<{ key: string; label: string; type?: "text" | "number" | "date" }>;
  rows: Record<string, any>[];
  summaryMetrics?: Array<{ label: string; value: string | number; change?: string }>;
  certificates?: AiCertificateItem[];
  students?: AiStudentCard[];
  chartSuggestion?: { type?: AiChartType; xKey?: string; yKey?: string; yKeys?: string[]; title?: string };
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: AiAgentStep[];
  isStepsOpen?: boolean;
  artifact?: AiReportArtifact | null;
  certificates?: AiCertificateItem[] | null;
  students?: AiStudentCard[] | null;
  sqlExecuted?: string | null;
  meta?: { durationMs: number; llmCalls: number; fastPath: boolean; model?: string };
  createdAt: string;
}

export interface AiSendResult {
  sessionId: string;
  sessionTitle: string;
  userMessage: AiChatMessage;
  assistantMessage: AiChatMessage;
}
