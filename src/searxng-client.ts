import { SearchParams, SearXNGResponse, SearchResult, FilterOptions } from './types.js';
import { Cache } from './cache.js';

/**
 * Client for interacting with SearXNG search engine
 */
export class SearXNGClient {
  private baseUrl: string;
  private cache: Cache<SearchResult[]>;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.cache = new Cache<SearchResult[]>(300000); // 5 minute cache
  }

  /**
   * Perform a search query
   */
  async search(params: SearchParams): Promise<SearchResult[]> {
    // Generate cache key from params
    const cacheKey = this.generateCacheKey(params);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      q: params.query,
      format: 'json',
    });

    if (params.categories && params.categories.length > 0) {
      queryParams.set('categories', params.categories.join(','));
    }

    if (params.engines && params.engines.length > 0) {
      queryParams.set('engines', params.engines.join(','));
    }

    if (params.language) {
      queryParams.set('language', params.language);
    }

    if (params.pageno) {
      queryParams.set('pageno', params.pageno.toString());
    }

    if (params.time_range) {
      queryParams.set('time_range', params.time_range);
    }

    if (params.safesearch !== undefined) {
      queryParams.set('safesearch', params.safesearch.toString());
    }

    // Make request to SearXNG
    const url = `${this.baseUrl}/search?${queryParams.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`SearXNG request failed: ${response.status} ${response.statusText}`);
      }

      const data: SearXNGResponse = await response.json();

      // Cache the results
      this.cache.set(cacheKey, data.results);

      return data.results;
    } catch (error) {
      throw new Error(`Failed to search SearXNG: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Perform multiple searches concurrently
   */
  async searchMultiple(queries: SearchParams[]): Promise<SearchResult[][]> {
    const searchPromises = queries.map(params => this.search(params));
    return Promise.all(searchPromises);
  }

  /**
   * Filter search results based on criteria
   */
  filterResults(results: SearchResult[], filters: FilterOptions): SearchResult[] {
    let filtered = [...results];

    // Filter by included domains
    if (filters.includeDomains && filters.includeDomains.length > 0) {
      filtered = filtered.filter(result => {
        const domain = this.extractDomain(result.url);
        return filters.includeDomains!.some(d => domain.includes(d));
      });
    }

    // Filter by excluded domains
    if (filters.excludeDomains && filters.excludeDomains.length > 0) {
      filtered = filtered.filter(result => {
        const domain = this.extractDomain(result.url);
        return !filters.excludeDomains!.some(d => domain.includes(d));
      });
    }

    // Filter by minimum score
    if (filters.minScore !== undefined) {
      filtered = filtered.filter(result =>
        result.score !== undefined && result.score >= filters.minScore!
      );
    }

    // Deduplicate by domain
    if (filters.deduplicateByDomain) {
      const seenDomains = new Set<string>();
      filtered = filtered.filter(result => {
        const domain = this.extractDomain(result.url);
        if (seenDomains.has(domain)) {
          return false;
        }
        seenDomains.add(domain);
        return true;
      });
    }

    // Limit number of results
    if (filters.maxResults !== undefined && filters.maxResults > 0) {
      filtered = filtered.slice(0, filters.maxResults);
    }

    return filtered;
  }

  /**
   * Generate a cache key from search parameters
   */
  private generateCacheKey(params: SearchParams): string {
    return JSON.stringify(params);
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}
