// Общие типы ИИ-чата (сервер). Клиент дублирует их в app/types/aiChat.ts

export interface AgentStep {
  step: number;
  thought: string;
  action: string;
  input?: any;
  output?: any;
  ms?: number;
}

export interface SummaryMetric {
  label: string;
  value: string | number;
  change?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
}

export interface CertificateItem {
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

export interface StudentCard {
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
  groups: Array<{
    id: string;
    code: string;
    courseName: string;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
  }>;
  groupsCount: number;
  certificates: CertificateItem[];
  certificatesCount: number;
}

export type ChartType = "bar" | "hbar" | "line" | "area" | "doughnut" | "pie";

export interface ReportArtifact {
  title: string;
  description?: string;
  columns: ColumnDef[];
  rows: Record<string, any>[];
  summaryMetrics?: SummaryMetric[];
  certificates?: CertificateItem[];
  students?: StudentCard[];
  chartSuggestion?: {
    type?: ChartType;
    xKey?: string;
    yKey?: string;
    yKeys?: string[];
    title?: string;
  };
}

export interface ChatEngineMeta {
  durationMs: number;
  llmCalls: number;
  fastPath: boolean;
  model?: string;
}

export interface ChatEngineResponse {
  reply: string;
  steps: AgentStep[];
  artifact: ReportArtifact | null;
  certificates?: CertificateItem[] | null;
  students?: StudentCard[] | null;
  sqlExecuted: string | null;
  meta?: ChatEngineMeta;
}

export interface UserContext {
  userId: string;
  name?: string;
  role: string;
  organizationId?: string | null;
  organizationName?: string | null;
  canViewAll: boolean;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
  sqlExecuted?: string;
}
