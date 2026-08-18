import type {
  BulkContactItem,
  BulkContactResult,
  Contact,
  ContactListResponse,
  CreateContactPayload,
  DashboardStats,
  UpdateContactPayload,
} from "@/types/contact";

const API = "/api/contacts";

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

export const contactApi = {
  getStats: () => request<DashboardStats>("/stats"),
  listContacts: (params?: {
    channel?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.channel) qs.set("channel", params.channel);
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("page_size", String(params.pageSize));
    const query = qs.toString();
    return request<ContactListResponse>(query ? `/?${query}` : "/");
  },
  createContact: (payload: CreateContactPayload) =>
    request<{ contact: Contact }>("/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateContact: (id: number, payload: UpdateContactPayload) =>
    request<{ contact: Contact }>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteContact: (id: number) =>
    request<{ message: string }>(`/${id}`, { method: "DELETE" }),
  bulkUpsert: (contacts: BulkContactItem[]) =>
    request<BulkContactResult>("/bulk", {
      method: "POST",
      body: JSON.stringify({ contacts }),
    }),
};
