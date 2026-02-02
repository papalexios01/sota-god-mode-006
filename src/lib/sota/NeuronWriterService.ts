// ============================================================
// NEURONWRITER SERVICE - Enterprise NeuronWriter Integration
// With intelligent fallback: Proxy -> Direct API
// ============================================================

export interface NeuronWriterProject {
  id: string;
  name: string;
  language?: string;
  engine?: string;
  created_at?: string;
  queries_count?: number;
}

export interface NeuronWriterQuery {
  id: string;
  query: string;
  keyword?: string;
  status: 'waiting' | 'in progress' | 'ready' | 'not found';
  created_at?: string;
  updated_at?: string;
  lang?: string;
  language?: string;
  location?: string;
  engine?: string;
  source?: string;
  tags?: string[];
}

export interface NeuronWriterAnalysis {
  query_id: string;
  keyword: string;
  status: string;
  terms: NeuronWriterTerm[];
  terms_txt?: {
    title: string;
    content_basic: string;
    content_basic_w_ranges: string;
    entities: string;
  };
  metrics?: {
    word_count: { median: number; target: number };
    readability: { median: number; target: number };
  };
  ideas?: {
    suggest_questions: { q: string }[];
    people_also_ask: { q: string }[];
    content_questions: { q: string }[];
  };
  competitors: NeuronWriterCompetitor[];
  recommended_length: number;
  content_score?: number;
}

export interface NeuronWriterTerm {
  term: string;
  weight: number;
  frequency: number;
  type: 'required' | 'recommended' | 'optional';
  usage_pc?: number;
  sugg_usage?: [number, number];
}

export interface NeuronWriterCompetitor {
  rank: number;
  url: string;
  title: string;
  desc?: string;
  content_score?: number;
  word_count?: number;
  score?: number;
}

const NEURON_API_BASE = 'https://app.neuronwriter.com/neuron-api/0.5/writer';

// Determine the best proxy URL for NeuronWriter API calls
function getProxyUrl(): string | null {
  // Check for Supabase functions first (preferred)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/functions/v1/neuronwriter-proxy`;
  }
  
  // In production with Cloudflare Pages
  if (typeof window !== 'undefined' && window.location.hostname.includes('lovable.app') === false) {
    return '/api/neuronwriter';
  }
  
  // No proxy available in preview
  return null;
}

export class NeuronWriterService {
  private apiKey: string;
  private proxyUrl: string | null;
  private useDirectApi: boolean = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
    this.proxyUrl = getProxyUrl();
  }

  /**
   * Make API request - tries proxy first, then direct API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: string = 'POST',
    body?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    // If we already know direct API works, use it
    if (this.useDirectApi || !this.proxyUrl) {
      return this.makeDirectRequest<T>(endpoint, method, body);
    }

    // Try proxy first
    try {
      const result = await this.makeProxyRequest<T>(endpoint, method, body);
      if (result.success) {
        return result;
      }
      
      // If proxy returns 404 or specific errors, try direct API
      if (result.error?.includes('404') || result.error?.includes('proxy not available')) {
        console.log('[NeuronWriter] Proxy unavailable, trying direct API...');
        this.useDirectApi = true;
        return this.makeDirectRequest<T>(endpoint, method, body);
      }
      
      return result;
    } catch (error) {
      console.log('[NeuronWriter] Proxy failed, trying direct API...');
      this.useDirectApi = true;
      return this.makeDirectRequest<T>(endpoint, method, body);
    }
  }

  /**
   * Make request through proxy
   */
  private async makeProxyRequest<T>(
    endpoint: string,
    method: string,
    body?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    if (!this.proxyUrl) {
      return { success: false, error: 'No proxy available' };
    }

    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-NeuronWriter-Key': this.apiKey,
        },
        body: JSON.stringify({
          endpoint,
          method,
          apiKey: this.apiKey,
          body,
        }),
      });

      if (response.status === 404) {
        return { success: false, error: 'Proxy returned 404 - proxy not available' };
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        return { success: false, error: 'Empty response from proxy' };
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        return { success: false, error: `Invalid JSON from proxy: ${text.substring(0, 100)}` };
      }

      if (!result.success) {
        return { success: false, error: result.error || `Proxy error: ${result.status}` };
      }

      return { success: true, data: result.data as T };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Proxy network error' 
      };
    }
  }

  /**
   * Make direct API request to NeuronWriter (may fail due to CORS in browser)
   */
  private async makeDirectRequest<T>(
    endpoint: string,
    method: string,
    body?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const url = `${NEURON_API_BASE}${endpoint}`;
    
    try {
      const fetchOptions: RequestInit = {
        method: method === 'GET' ? 'GET' : 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      console.log(`[NeuronWriter] Direct API call: ${method} ${endpoint}`);
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        // Check for common error codes
        if (response.status === 401 || response.status === 403) {
          return { success: false, error: 'Invalid API key. Please check your NeuronWriter API key.' };
        }
        if (response.status === 429) {
          return { success: false, error: 'Rate limit exceeded. Please try again later.' };
        }
        return { success: false, error: `API error: ${response.status} ${response.statusText}` };
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        return { success: false, error: 'Empty response from NeuronWriter API' };
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return { success: false, error: `Invalid JSON response: ${text.substring(0, 100)}` };
      }

      return { success: true, data: data as T };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for CORS errors
      if (errorMsg.includes('CORS') || errorMsg.includes('NetworkError') || errorMsg.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'CORS error: NeuronWriter API cannot be called directly from the browser. Please enable Lovable Cloud or deploy to production for this feature.'
        };
      }
      
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Validate API key by attempting to list projects
   */
  async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
    const result = await this.listProjects();
    return { valid: result.success, error: result.error };
  }

  /**
   * List all projects for the account
   * API: /list-projects (POST, no body required)
   */
  async listProjects(): Promise<{ success: boolean; projects?: NeuronWriterProject[]; error?: string }> {
    const result = await this.makeRequest<NeuronWriterProject[] | { projects: NeuronWriterProject[] }>(
      '/list-projects',
      'POST',
      {}
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Handle both array and object response formats
    let projects: NeuronWriterProject[] = [];
    if (Array.isArray(result.data)) {
      projects = result.data.map((p: any) => ({
        id: p.project || p.id,
        name: p.name,
        language: p.language,
        engine: p.engine,
      }));
    } else if (result.data && 'projects' in (result.data as any)) {
      projects = (result.data as any).projects;
    }

    return { success: true, projects };
  }

  /**
   * List queries for a specific project
   * API: /list-queries (POST)
   */
  async listQueries(projectId: string, options?: {
    status?: 'waiting' | 'in progress' | 'ready';
    source?: 'neuron' | 'neuron-api';
    tags?: string[];
  }): Promise<{ success: boolean; queries?: NeuronWriterQuery[]; error?: string }> {
    const result = await this.makeRequest<NeuronWriterQuery[]>(
      '/list-queries',
      'POST',
      { 
        project: projectId,
        ...options
      }
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const queries = ((result.data as any[]) || []).map((q: any) => ({
      id: q.query || q.id,
      query: q.query || q.id,
      keyword: q.keyword,
      status: q.status || 'ready',
      created_at: q.created || q.created_at,
      updated_at: q.updated || q.updated_at,
      language: q.language,
      engine: q.engine,
      source: q.source,
      tags: q.tags,
    }));

    return { success: true, queries };
  }

  /**
   * Create a new query (keyword analysis)
   * API: /new-query (POST)
   */
  async createQuery(
    projectId: string,
    keyword: string,
    language: string = 'English',
    engine: string = 'google.com'
  ): Promise<{ success: boolean; queryId?: string; queryUrl?: string; shareUrl?: string; error?: string }> {
    const result = await this.makeRequest<{
      query: string;
      query_url: string;
      share_url: string;
      readonly_url: string;
    }>(
      '/new-query',
      'POST',
      { 
        project: projectId,
        keyword,
        language,
        engine
      }
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { 
      success: true, 
      queryId: result.data?.query,
      queryUrl: result.data?.query_url,
      shareUrl: result.data?.share_url
    };
  }

  /**
   * Get query analysis data (recommendations)
   * API: /get-query (POST)
   */
  async getQueryAnalysis(queryId: string): Promise<{ success: boolean; analysis?: NeuronWriterAnalysis; error?: string }> {
    const result = await this.makeRequest<any>(
      '/get-query',
      'POST',
      { query: queryId }
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const data = result.data;
    
    // Check if analysis is ready
    if (data?.status !== 'ready') {
      return { 
        success: false, 
        error: `Query not ready yet. Status: ${data?.status || 'unknown'}. Try again in a few seconds.`
      };
    }

    // Parse terms from the response
    const terms: NeuronWriterTerm[] = [];
    if (data.terms?.content_basic) {
      data.terms.content_basic.forEach((t: any) => {
        terms.push({
          term: t.t,
          weight: t.usage_pc || 50,
          frequency: t.sugg_usage?.[1] || 1,
          type: t.usage_pc >= 70 ? 'required' : t.usage_pc >= 40 ? 'recommended' : 'optional',
          usage_pc: t.usage_pc,
          sugg_usage: t.sugg_usage,
        });
      });
    }

    const analysis: NeuronWriterAnalysis = {
      query_id: queryId,
      keyword: data.keyword || '',
      status: data.status,
      terms,
      terms_txt: data.terms_txt,
      metrics: data.metrics,
      ideas: data.ideas,
      competitors: (data.competitors || []).map((c: any) => ({
        rank: c.rank,
        url: c.url,
        title: c.title,
        desc: c.desc,
        content_score: c.content_score,
      })),
      recommended_length: data.metrics?.word_count?.target || 1500,
    };

    return { success: true, analysis };
  }

  /**
   * Get recommended terms for content optimization
   */
  async getRecommendedTerms(queryId: string): Promise<{ success: boolean; terms?: NeuronWriterTerm[]; error?: string }> {
    const analysisResult = await this.getQueryAnalysis(queryId);
    
    if (!analysisResult.success) {
      return { success: false, error: analysisResult.error };
    }

    return { success: true, terms: analysisResult.analysis?.terms || [] };
  }

  /**
   * Import content to a query for scoring
   * API: /import-content (POST)
   */
  async importContent(
    queryId: string,
    content: {
      html?: string;
      title?: string;
      description?: string;
      url?: string;
    }
  ): Promise<{ success: boolean; contentScore?: number; error?: string }> {
    const result = await this.makeRequest<{ status: string; content_score?: number }>(
      '/import-content',
      'POST',
      { 
        query: queryId,
        ...content
      }
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { 
      success: true, 
      contentScore: result.data?.content_score 
    };
  }

  /**
   * Evaluate content without saving (just get score)
   * API: /evaluate-content (POST)
   */
  async evaluateContent(
    queryId: string,
    content: {
      html?: string;
      title?: string;
      description?: string;
      url?: string;
    }
  ): Promise<{ success: boolean; contentScore?: number; error?: string }> {
    const result = await this.makeRequest<{ status: string; content_score?: number }>(
      '/evaluate-content',
      'POST',
      { 
        query: queryId,
        ...content
      }
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { 
      success: true, 
      contentScore: result.data?.content_score 
    };
  }

  /**
   * Calculate content score against NeuronWriter optimization targets
   */
  calculateContentScore(content: string, terms: NeuronWriterTerm[]): number {
    const contentLower = content.toLowerCase();
    let totalWeight = 0;
    let achievedWeight = 0;

    terms.forEach(term => {
      const termLower = term.term.toLowerCase();
      const regex = new RegExp(termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const count = (contentLower.match(regex) || []).length;
      
      totalWeight += term.weight;
      
      if (count >= term.frequency) {
        achievedWeight += term.weight;
      } else if (count > 0) {
        achievedWeight += (term.weight * count) / term.frequency;
      }
    });

    return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
  }

  /**
   * Get optimization suggestions based on terms
   */
  getOptimizationSuggestions(content: string, terms: NeuronWriterTerm[]): string[] {
    const suggestions: string[] = [];
    const contentLower = content.toLowerCase();

    terms.forEach(term => {
      const termLower = term.term.toLowerCase();
      const regex = new RegExp(termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const count = (contentLower.match(regex) || []).length;
      
      if (term.type === 'required' && count < term.frequency) {
        const range = term.sugg_usage ? `${term.sugg_usage[0]}-${term.sugg_usage[1]}x` : `${term.frequency}x`;
        suggestions.push(`Add "${term.term}" (currently ${count}x, target: ${range})`);
      } else if (term.type === 'recommended' && count === 0) {
        suggestions.push(`Consider adding "${term.term}" (recommended term, ${term.usage_pc || 50}% competitor usage)`);
      }
    });

    return suggestions.slice(0, 20);
  }

  /**
   * Format terms for AI prompt
   */
  formatTermsForPrompt(terms: NeuronWriterTerm[]): string {
    const required = terms.filter(t => t.type === 'required');
    const recommended = terms.filter(t => t.type === 'recommended');

    let prompt = '### REQUIRED TERMS (must include):\n';
    prompt += required.map(t => {
      const range = t.sugg_usage ? `${t.sugg_usage[0]}-${t.sugg_usage[1]}x` : `${t.frequency}x`;
      return `- ${t.term}: ${range}`;
    }).join('\n');

    prompt += '\n\n### RECOMMENDED TERMS (try to include):\n';
    prompt += recommended.slice(0, 15).map(t => `- ${t.term}`).join('\n');

    return prompt;
  }
}

export function createNeuronWriterService(apiKey: string): NeuronWriterService {
  return new NeuronWriterService(apiKey);
}

// Singleton for reuse
let serviceInstance: NeuronWriterService | null = null;

export function getNeuronWriterService(apiKey?: string): NeuronWriterService | null {
  if (apiKey) {
    serviceInstance = new NeuronWriterService(apiKey);
  }
  return serviceInstance;
}
