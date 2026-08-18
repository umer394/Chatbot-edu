export type ContactChannel = "email" | "whatsapp";
export type ContactStatus = "pending" | "sent" | "failed";

export type Contact = {
  id: number;
  channel: ContactChannel;
  contactValue: string;
  businessName: string;
  status: ContactStatus;
  lastCampaignId: number | null;
  lastSentAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ContactListResponse = {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ChannelStats = {
  total: number;
  pending: number;
  sent: number;
  failed: number;
};

export type CampaignChannelStats = {
  total: number;
  active: number;
  scheduled: number;
  paused: number;
  completed: number;
  failed: number;
};

export type DashboardStats = {
  contacts: {
    email: ChannelStats;
    whatsapp: ChannelStats;
    total: ChannelStats;
  };
  campaigns: {
    email: CampaignChannelStats;
    whatsapp: CampaignChannelStats;
    total: CampaignChannelStats;
  };
};

export type CreateContactPayload = {
  channel: ContactChannel;
  contactValue: string;
  businessName?: string;
};

export type UpdateContactPayload = {
  businessName?: string;
  status?: ContactStatus;
};

export type BulkContactItem = {
  channel: ContactChannel;
  contactValue: string;
  businessName?: string;
};

export type BulkContactResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};
