# SearXNG MCP Server for LM Studio

A Model Context Protocol (MCP) server that provides web search capabilities to local LLMs running in LM Studio using a privacy-focused local SearXNG instance.

## Features

- **Web Search**: Search the web using your local SearXNG instance
- **Concurrent Searches**: Execute multiple searches simultaneously
- **Result Caching**: Automatic caching with configurable TTL to reduce API calls
- **Advanced Filtering**: Filter results by domain, deduplicate, and limit results
- **Privacy-First**: All searches run through your local SearXNG instance
- **High Performance**: Built with TypeScript and async/await for optimal performance

## Quick Start

### 1. Install and Build

```bash
# Clone the repository
git clone https://github.com/Pascalrjt/SearXNG-Websearch-MCP.git
cd SearXNG-Websearch-MCP

# Install dependencies and build
npm install
npm run build
```

### 2. Start SearXNG

```bash
npm run docker:up
```

Verify SearXNG is running by visiting http://localhost:8080 in your browser.

### 3. Configure LM Studio

Add to your LM Studio MCP configuration file:

```json
{
  "mcpServers": {
    "websearch-searxng": {
      "command": "node",
      "args": ["/path/to/SearXNG-Websearch-MCP/dist/index.js"],
      "env": {}
    }
  }
}
```

**Config file location:**

- **macOS**: `~/Library/Application Support/LM Studio/mcp_config.json`
- **Windows**: `%APPDATA%\LM Studio\mcp_config.json`
- **Linux**: `~/.config/lm-studio/mcp_config.json`

**Note**: Replace `/path/to/SearXNG-Websearch-MCP` with your actual installation path.

### 4. Restart LM Studio

Close and reopen LM Studio for the MCP server to be recognized.

### 5. Test It Out

Try asking your LLM:

```
Search for "quantum computing breakthroughs 2024" and summarize the top findings
```

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- LM Studio

## System Prompt

The repository includes `prompt.md`, a comprehensive system prompt that guides your LLM to effectively use the web search tools. This prompt teaches the LLM to:

- Always determine current date for time-sensitive queries
- Verify facts across multiple sources
- Use advanced filtering (domains, time ranges, categories)
- Handle concurrent searches for complex research
- Properly manage the search cache

### Using the System Prompt in LM Studio

1. Open `prompt.md` in the repository
2. Copy the entire contents
3. In LM Studio, go to **Settings → System Prompt**
4. Paste the prompt

The LLM will now automatically use web search tools more effectively, providing better research and verification of facts.

## Detailed Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd websearch-searXNG
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start SearXNG Docker Container

```bash
npm run docker:up
```

This will start SearXNG on `http://localhost:8080`. You can verify it's running by visiting this URL in your browser.

### 4. Build the MCP Server

```bash
npm run build
```

## Available Tools

### 1. `web_search`

Perform a single web search with advanced filtering options.

**Parameters:**

- `query` (required): The search query string
- `maxResults` (optional, default: 10): Maximum number of results to return
- `language` (optional): Language code for results (e.g., "en", "es", "fr")
- `timeRange` (optional): Filter by time ("day", "week", "month", "year")
- `categories` (optional): Array of categories (e.g., ["general", "news"])
- `includeDomains` (optional): Only include results from these domains
- `excludeDomains` (optional): Exclude results from these domains
- `deduplicateByDomain` (optional, default: false): Return only one result per domain

### 2. `multi_search`

Perform multiple searches concurrently for efficient information gathering.

**Parameters:**

- `queries` (required): Array of search query objects
  - Each query can have: `query`, `maxResults`, `language`, `timeRange`, `categories`
- `globalFilters` (optional): Filters to apply to all results
  - `includeDomains`, `excludeDomains`, `deduplicateByDomain`

### 3. `clear_cache`

Clear the search results cache to free memory or force fresh results.

**Parameters:** None

## Usage Examples

### Basic Search

```
Search for "climate change solutions" and summarize the findings
```

### Time-Filtered Search

```
Search for news about "artificial intelligence" from the last week
```

### Domain-Specific Search

```
Search for "TypeScript best practices" but only show results from
official documentation sites like typescriptlang.org and microsoft.com
```

### Exclude Domains

```
Search for recent news about "renewable energy" from the last month,
excluding results from social media domains
```

### Multiple Concurrent Searches

```
I need to compare three topics. Search for:
1. "rust programming language advantages"
2. "golang performance benchmarks"
3. "python async programming"

Summarize the key differences between these languages.
```

### Complex Research Query

```
I need information on "quantum computing", "artificial intelligence ethics",
and "blockchain technology". Search for all three and compare their current state.
```

## Docker Management

### Start SearXNG

```bash
npm run docker:up
```

### Stop SearXNG

```bash
npm run docker:down
```

### View SearXNG Logs

```bash
npm run docker:logs
```

### Access SearXNG Web Interface

Open your browser and navigate to: http://localhost:8080

## Development

### Build TypeScript

```bash
npm run build
```

### Watch Mode (for development)

```bash
npm run dev
```

## Architecture

```
┌─────────────┐
│  LM Studio  │
└──────┬──────┘
       │ MCP Protocol
       │
┌──────▼──────────────┐
│  MCP Server         │
│  (index.ts)         │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  SearXNG Client     │
│  (searxng-client.ts)│
│                     │
│  ┌───────────────┐  │
│  │ Cache System  │  │
│  └───────────────┘  │
└──────┬──────────────┘
       │ HTTP API
       │
┌──────▼──────────────┐
│  SearXNG Instance   │
│  (Docker Container) │
│  localhost:8080     │
└─────────────────────┘
```

## Caching Behavior

- Search results are cached for 5 minutes by default
- Cache key is generated from search parameters
- Automatic cleanup of expired entries every minute
- Use `clear_cache` tool to manually clear the cache

## Filtering Capabilities

### Domain Filtering

- **Include Domains**: Only show results from specified domains
- **Exclude Domains**: Filter out results from specified domains

### Result Limiting

- **Max Results**: Limit the number of results returned
- **Deduplicate by Domain**: Show only one result per domain

### Time Range Filtering

- **Day**: Results from the last 24 hours
- **Week**: Results from the last 7 days
- **Month**: Results from the last 30 days
- **Year**: Results from the last 365 days

## Troubleshooting

### MCP Server Not Connecting in LM Studio

1. Verify the build completed successfully: `npm run build`
2. Check the dist folder exists: `ls dist/index.js`
3. Ensure the path in LM Studio config is absolute and correct
4. Restart LM Studio completely

### Search Returns No Results

1. Verify SearXNG is running: Visit http://localhost:8080 in browser
2. Test the API: `curl "http://localhost:8080/search?q=test&format=json"`
3. Clear cache using the `clear_cache` tool
4. Check Docker logs: `npm run docker:logs`

### SearXNG Container Not Starting

```bash
# Check if port 8080 is already in use
lsof -i :8080

# View container logs
npm run docker:logs

# Restart the container
npm run docker:down && npm run docker:up
```

### Cache Issues

Use the `clear_cache` tool in LM Studio, or restart LM Studio to restart the MCP server.

## Performance Tips

1. **Use Caching**: Results are cached automatically for 5 minutes
2. **Concurrent Searches**: Use `multi_search` for multiple queries instead of sequential searches
3. **Filter Early**: Use `maxResults` to limit results and reduce processing
4. **Domain Filtering**: Filter by domain to get more relevant results faster
5. **System Prompt**: Use the included `prompt.md` to teach your LLM optimal search strategies

## Security & Privacy

- All searches run through your local SearXNG instance
- No data sent to external MCP providers
- SearXNG can be configured to use specific search engines
- Full control over search privacy settings

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Review SearXNG logs: `npm run docker:logs`
3. Verify your Node.js version: `node --version` (should be 18+)
4. Ensure Docker is running properly
5. Check that paths in LM Studio config are correct and absolute
