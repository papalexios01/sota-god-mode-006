import type { VercelRequest, VercelResponse } from '@vercel/node';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function isPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const {
      wpUrl, username, appPassword, title, content,
      excerpt, status = 'draft', categories, tags, slug,
      metaDescription, seoTitle, sourceUrl, existingPostId,
    } = req.body;

    if (!wpUrl || !username || !appPassword || !title || !content) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    let baseUrl = wpUrl.trim().replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

    if (!isPublicUrl(baseUrl)) {
      return res.status(400).json({ success: false, error: 'WordPress URL must be a public HTTP/HTTPS address' });
    }

    const apiUrl = `${baseUrl}/wp-json/wp/v2/posts`;
    const authBase64 = Buffer.from(`${username}:${appPassword}`).toString('base64');
    const authHeaders: Record<string, string> = {
      'Authorization': `Basic ${authBase64}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const wpFetch = async (url: string, options: RequestInit = {}): Promise<globalThis.Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    let targetPostId: number | null = existingPostId ? parseInt(String(existingPostId), 10) : null;
    if (targetPostId !== null && isNaN(targetPostId)) targetPostId = null;

    if (!targetPostId && slug) {
      try {
        const cleanSlug = slug.replace(/^\/+|\/+$/g, '').split('/').pop() || slug;
        const searchRes = await wpFetch(`${apiUrl}?slug=${encodeURIComponent(cleanSlug)}&status=any`, { headers: authHeaders });
        if (searchRes.ok) {
          const posts = await searchRes.json();
          if (Array.isArray(posts) && posts.length > 0) targetPostId = posts[0].id;
        }
      } catch {}
    }

    if (!targetPostId && sourceUrl) {
      try {
        const pathMatch = sourceUrl.match(/\/([^/]+)\/?$/);
        if (pathMatch) {
          const sourceSlug = pathMatch[1].replace(/\/$/, '');
          const searchRes = await wpFetch(`${apiUrl}?slug=${encodeURIComponent(sourceSlug)}&status=any`, { headers: authHeaders });
          if (searchRes.ok) {
            const posts = await searchRes.json();
            if (Array.isArray(posts) && posts.length > 0) targetPostId = posts[0].id;
          }
        }
      } catch {}
    }

    const postData: Record<string, unknown> = { title, content, status };
    if (excerpt) postData.excerpt = excerpt;
    if (slug) postData.slug = slug.replace(/^\/+|\/+$/g, '').split('/').pop() || slug;
    if (categories?.length) postData.categories = categories;
    if (tags?.length) postData.tags = tags;

    if (metaDescription || seoTitle) {
      postData.meta = {
        _yoast_wpseo_metadesc: metaDescription || '',
        _yoast_wpseo_title: seoTitle || title,
        rank_math_description: metaDescription || '',
        rank_math_title: seoTitle || title,
        _aioseo_description: metaDescription || '',
        _aioseo_title: seoTitle || title,
      };
    }

    const targetUrl = targetPostId ? `${apiUrl}/${targetPostId}` : apiUrl;
    const method = targetPostId ? 'PUT' : 'POST';

    let response: globalThis.Response;
    try {
      response = await wpFetch(targetUrl, { method, headers: authHeaders, body: JSON.stringify(postData) });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      const isTimeout = msg.includes('abort') || msg.includes('timeout');
      return res.status(isTimeout ? 504 : 502).json({
        success: false,
        error: isTimeout
          ? 'Connection to WordPress timed out. Check that the URL is correct and reachable.'
          : `Could not connect to WordPress: ${msg}`,
        status: isTimeout ? 504 : 502,
      });
    }

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `WordPress API error: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {}

      if (response.status === 401) errorMessage = 'Authentication failed. Check your username and application password.';
      else if (response.status === 403) errorMessage = 'Permission denied. Ensure the user has publish capabilities.';
      else if (response.status === 404) errorMessage = 'WordPress REST API not found. Ensure permalinks are enabled.';

      return res.json({ success: false, error: errorMessage, status: response.status });
    }

    let post: { id: number; link: string; status: string; title?: { rendered: string }; slug: string };
    try {
      post = JSON.parse(responseText);
    } catch {
      return res.json({ success: false, error: 'Invalid response from WordPress' });
    }

    return res.json({
      success: true,
      updated: !!targetPostId,
      post: {
        id: post.id,
        url: post.link,
        status: post.status,
        title: post.title?.rendered || title,
        slug: post.slug,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
}
