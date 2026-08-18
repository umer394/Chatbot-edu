import type {
  Campaign,
  CampaignListResponse,
  CreateCampaignPayload,
  CreateTemplatePayload,
  CampaignTemplate,
  DailyQuota,
  TemplateChannel,
  WhatsAppStatus,
} from "@/types/campaign";

const API = "/api/campaigns";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || data.detail || "Request failed");
  }
  return data as T;
}

export const campaignApi = {
  getQuota: (channel: TemplateChannel = "email") =>
    request<DailyQuota>(`/quota?channel=${channel}`),
  listTemplates: (channel?: string) =>
    request<{ templates: CampaignTemplate[] }>(
      `/templates${channel ? `?channel=${channel}` : ""}`
    ),
  createTemplate: (payload: CreateTemplatePayload) =>
    request<{ template: CampaignTemplate }>("/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTemplate: (id: number, payload: CreateTemplatePayload) =>
    request<{ template: CampaignTemplate }>(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteTemplate: (id: number) =>
    request<{ message: string }>(`/templates/${id}`, { method: "DELETE" }),
  listCampaigns: (params?: { status?: string; channel?: TemplateChannel; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.channel) qs.set("channel", params.channel);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("page_size", String(params.pageSize));
    const query = qs.toString();
    return request<CampaignListResponse>(`/list${query ? `?${query}` : ""}`);
  },
  getCampaign: (id: number) => request<{ campaign: Campaign }>(`/${id}`),
  createCampaign: (payload: CreateCampaignPayload) =>
    request<{ campaign: Campaign }>("/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCampaign: (id: number, payload: Partial<CreateCampaignPayload> & { status?: string }) =>
    request<{ campaign: Campaign }>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  pauseCampaign: (id: number) =>
    request<{ campaign: Campaign }>(`/${id}/pause`, { method: "POST" }),
  resumeCampaign: (id: number) =>
    request<{ campaign: Campaign }>(`/${id}/resume`, { method: "POST" }),
  runCampaignNow: (id: number) =>
    request<{ campaign: Campaign }>(`/${id}/run`, { method: "POST" }),
};

export const whatsappApi = {
  getStatus: async (): Promise<WhatsAppStatus> => {
    const resp = await fetch("/api/auth/whatsapp/status", { credentials: "include" });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Failed to load WhatsApp status");
    return data;
  },
  connect: async (): Promise<WhatsAppStatus> => {
    const resp = await fetch("/api/auth/whatsapp/connect", {
      method: "POST",
      credentials: "include",
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Failed to connect WhatsApp");
    return data;
  },
  disconnect: async () => {
    const resp = await fetch("/api/auth/whatsapp/disconnect", {
      method: "POST",
      credentials: "include",
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Failed to disconnect");
    return data;
  },
};

export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  const vars = matches.map((m) => m.replace(/\{\{|\}\}/g, ""));
  return [...new Set(vars)];
}

export function renderPreview(text: string, sample: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(sample)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}
