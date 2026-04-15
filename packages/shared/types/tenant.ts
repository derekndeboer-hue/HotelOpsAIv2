export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  subscriptionTier: 'free' | 'professional' | 'enterprise';
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
