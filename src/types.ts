/**
 * Search result from SearXNG
 */
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine?: string;
  score?: number;
  category?: string;
  publishedDate?: string;
}

/**
 * SearXNG API response
 */
export interface SearXNGResponse {
  query: string;
  number_of_results: number;
  results: SearchResult[];
  answers?: string[];
  corrections?: string[];
  infoboxes?: any[];
  suggestions?: string[];
  unresponsive_engines?: string[];
}

/**
 * Search parameters
 */
export interface SearchParams {
  query: string;
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
  time_range?: '' | 'day' | 'week' | 'month' | 'year';
  format?: 'json' | 'html';
  safesearch?: 0 | 1 | 2;
}

/**
 * Filter options for results
 */
export interface FilterOptions {
  includeDomains?: string[];
  excludeDomains?: string[];
  minScore?: number;
  maxResults?: number;
  deduplicateByDomain?: boolean;
}

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
