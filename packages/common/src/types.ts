import type { PluginError } from 'x-fidelity';

export interface ApiCallParams {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
  includeValue?: boolean;
}

export interface ApiCallResult {
  success: boolean;
  extractedValue?: string;
  apiResponse?: any;
  timestamp: string;
  error?: string;
}

export interface RegexExtractResult {
  success: boolean;
  matches?: string[];
  error?: string;
}

export { PluginError };
