export interface User {
  id: string;
  username: string;
  plan: 'free' | 'basic' | 'premium' | 'pro' | 'owner';
  whitelisted: boolean;
  whitelisted_at?: string;
  whitelist_expires?: string;
  whitelist_plan?: string;
  blacklisted: boolean;
  blacklist_reason?: string;
  blacklisted_at?: string;
  created_at: string;
}

export interface Script {
  id: string;
  user_id: string;
  script_name: string;
  script_key: string;
  loader_path: string;
  source_code: string;
  enabled: boolean;
  keyless_mode: boolean;
  downloads: number;
  last_used?: string;
  created_at: string;
}

export interface APIKey {
  id: string;
  user_id: string;
  key: string;
  plan: string;
  created_at: string;
}
