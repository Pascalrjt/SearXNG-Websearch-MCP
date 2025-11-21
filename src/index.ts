#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { SearXNGClient } from './searxng-client.js';
import { SearchParams, FilterOptions } from './types.js';

// Initialize SearXNG client
const searxng = new SearXNGClient('http://localhost:8080');

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'web_search',
    description: 'Search the web using SearXNG. Returns relevant web pages with titles, URLs, and content snippets. Supports filtering and multiple concurrent searches.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query string',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
          default: 10,
        },
        language: {
          type: 'string',
          description: 'Language code for search results (e.g., "en", "es", "fr")',
        },
        timeRange: {
          type: 'string',
          description: 'Time range filter for results',
          enum: ['', 'day', 'week', 'month', 'year'],
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Categories to search (e.g., ["general", "news", "science"])',
        },
        includeDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Only include results from these domains',
        },
        excludeDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exclude results from these domains',
        },
        deduplicateByDomain: {
          type: 'boolean',
          description: 'Only return one result per domain (default: false)',
          default: false,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'multi_search',
    description: 'Perform multiple web searches concurrently. Useful for comparing information from different queries or exploring related topics simultaneously.',
    inputSchema: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              maxResults: { type: 'number' },
              language: { type: 'string' },
              timeRange: { type: 'string', enum: ['', 'day', 'week', 'month', 'year'] },
              categories: { type: 'array', items: { type: 'string' } },
            },
            required: ['query'],
          },
          description: 'Array of search queries to execute concurrently',
        },
        globalFilters: {
          type: 'object',
          properties: {
            includeDomains: { type: 'array', items: { type: 'string' } },
            excludeDomains: { type: 'array', items: { type: 'string' } },
            deduplicateByDomain: { type: 'boolean' },
          },
          description: 'Filters to apply to all search results',
        },
      },
      required: ['queries'],
    },
  },
  {
    name: 'clear_cache',
    description: 'Clear the search results cache. Useful when you need fresh results or to free up memory.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'websearch-searxng',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'web_search': {
        const {
          query,
          maxResults = 10,
          language,
          timeRange,
          categories,
          includeDomains,
          excludeDomains,
          deduplicateByDomain = false,
        } = args as {
          query: string;
          maxResults?: number;
          language?: string;
          timeRange?: '' | 'day' | 'week' | 'month' | 'year';
          categories?: string[];
          includeDomains?: string[];
          excludeDomains?: string[];
          deduplicateByDomain?: boolean;
        };

        // Build search parameters
        const searchParams: SearchParams = {
          query,
          language,
          time_range: timeRange,
          categories,
          format: 'json',
        };

        // Perform search
        let results = await searxng.search(searchParams);

        // Apply filters
        const filters: FilterOptions = {
          maxResults,
          includeDomains,
          excludeDomains,
          deduplicateByDomain,
        };

        results = searxng.filterResults(results, filters);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query,
                  resultsCount: results.length,
                  results: results.map((r) => ({
                    title: r.title,
                    url: r.url,
                    content: r.content,
                    publishedDate: r.publishedDate,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'multi_search': {
        const { queries, globalFilters } = args as {
          queries: Array<{
            query: string;
            maxResults?: number;
            language?: string;
            timeRange?: '' | 'day' | 'week' | 'month' | 'year';
            categories?: string[];
          }>;
          globalFilters?: FilterOptions;
        };

        // Build search parameters for each query
        const searchParams: SearchParams[] = queries.map((q) => ({
          query: q.query,
          language: q.language,
          time_range: q.timeRange,
          categories: q.categories,
          format: 'json',
        }));

        // Perform concurrent searches
        const allResults = await searxng.searchMultiple(searchParams);

        // Apply filters to each result set
        const filteredResults = allResults.map((results, index) => {
          const filters: FilterOptions = {
            maxResults: queries[index].maxResults,
            ...globalFilters,
          };
          return searxng.filterResults(results, filters);
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  searches: filteredResults.map((results, index) => ({
                    query: queries[index].query,
                    resultsCount: results.length,
                    results: results.map((r) => ({
                      title: r.title,
                      url: r.url,
                      content: r.content,
                      publishedDate: r.publishedDate,
                    })),
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'clear_cache': {
        searxng.clearCache();
        return {
          content: [
            {
              type: 'text',
              text: 'Cache cleared successfully',
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SearXNG MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
