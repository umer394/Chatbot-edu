export type TemplateChannel = "email" | "whatsapp";
export type TemplateType = "simple" | "dynamic";

export type CampaignStatus =
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "failed";

export type RecipientStatus = "pending" | "sent" | "failed";

export interface TemplateAttachment {
  name: string;
  mimeType: string;
  contentBase64: string;
}

export interface CampaignTemplate {
  id: number;
  name: string;
  channel: TemplateChannel;
  templateType: TemplateType;
  subject: string;
  body: string;
  links: string[];
  attachments: TemplateAttachment[];
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  id?: number;
  email: string;
  phone?: string;
  name: string;
  company: string;
  customVariables: Record<string, string>;
  status?: RecipientStatus;
  sentAt?: string | null;
  errorMessage?: string | null;
}

export interface Campaign {
  id: number;
  name: string;
  channel: TemplateChannel;
  templateId: number;
  templateName?: string;
  status: CampaignStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  fromEmail: string | null;
  fromPhone?: string | null;
  recipients?: CampaignRecipient[];
  recipientsTotal: number;
  recipientsSent: number;
  recipientsFailed: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DailyQuota {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
  channel?: TemplateChannel;
}

export interface WhatsAppStatus {
  connected: boolean;
  phone: string | null;
  status: string;
  qr?: string | null;
  syncing?: boolean;
  hasStoredSession?: boolean;
  error?: string | null;
}

export interface CreateTemplatePayload {
  name: string;
  channel: TemplateChannel;
  templateType: TemplateType;
  subject: string;
  body: string;
  links: string[];
  attachments: TemplateAttachment[];
}

export interface CreateCampaignPayload {
  name: string;
  templateId: number;
  scheduledAt: string | null;
  recipients: Omit<CampaignRecipient, "id" | "status" | "sentAt" | "errorMessage">[];
}

export const MAX_RECIPIENTS_PER_CAMPAIGN = 10;
export const MAX_RECIPIENTS_PER_DAY = 10;
export const DEFAULT_VARIABLES = ["name", "company", "email", "phone"] as const;
