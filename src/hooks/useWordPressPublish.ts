import { useState, useCallback } from 'react';
import { useOptimizerStore } from '@/lib/store';

interface PublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
}

interface PublishBody {
  wpUrl: string;
  username: string;
  appPassword: string;
  title: string;
  content: string;
  excerpt?: string;
  status: string;
  slug?: string;
  metaDescription?: string;
  seoTitle?: string;
  sourceUrl?: string;
  existingPostId?: number;
}

export function useWordPressPublish() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const { config } = useOptimizerStore();

  const publish = useCallback(async (
    title: string,
    content: string,
    options?: {
      excerpt?: string;
      status?: 'draft' | 'publish' | 'pending' | 'private';
      slug?: string;
      metaDescription?: string;
      seoTitle?: string;
      sourceUrl?: string;
      existingPostId?: number;
    }
  ): Promise<PublishResult> => {
    setIsPublishing(true);
    setPublishResult(null);

    try {
      if (!config.wpUrl || !config.wpUsername || !config.wpAppPassword) {
        throw new Error('WordPress not configured. Add WordPress URL, username, and application password in Setup.');
      }

      let baseUrl = config.wpUrl.trim().replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }

      try {
        const parsed = new URL(baseUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('WordPress URL must use HTTP or HTTPS');
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('HTTP')) throw e;
        throw new Error('Invalid WordPress URL format');
      }

      const safeSlug = options?.slug ? options.slug.replace(/^\/+/, '').split('/').pop() : undefined;

      const body: PublishBody = {
        wpUrl: config.wpUrl,
        username: config.wpUsername,
        appPassword: config.wpAppPassword,
        title,
        content,
        excerpt: options?.excerpt,
        status: options?.status || 'draft',
        slug: safeSlug,
        metaDescription: options?.metaDescription,
        seoTitle: options?.seoTitle,
        sourceUrl: options?.sourceUrl,
        existingPostId: options?.existingPostId,
      };

      const result = await publishWithCascade(baseUrl, body);

      setPublishResult(result);
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const result: PublishResult = {
        success: false,
        error: errorMsg,
      };
      setPublishResult(result);
      return result;
    } finally {
      setIsPublishing(false);
    }
  }, [config]);

  const clearResult = useCallback(() => {
    setPublishResult(null);
  }, []);

  return {
    publish,
    isPublishing,
    publishResult,
    clearResult,
    isConfigured: !!(config.wpUrl && config.wpUsername && config.wpAppPassword),
  };
}

async function publishWithCascade(baseUrl: string, body: PublishBody): Promise<PublishResult> {
  // Tier 1: Direct WordPress REST API call from browser
  const directResult = await publishDirectToWordPress(baseUrl, body);
  if (directResult) return directResult;

  // Tier 2: Supabase Edge Function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    const edgeResult = await publishViaProxy(
      `${supabaseUrl}/functions/v1/wordpress-publish`,
      body,
      { 'Authorization': `Bearer ${supabaseKey}` },
      'supabase-edge'
    );
    if (edgeResult) return edgeResult;
  }

  // Tier 3: Serverless function (Vercel/Cloudflare)
  const serverlessResult = await publishViaProxy('/api/wordpress-publish', body, {}, 'serverless');
  if (serverlessResult) return serverlessResult;

  throw new Error('Failed to publish. Could not reach WordPress or any proxy endpoint. Check your WordPress URL and credentials.');
}

async function publishDirectToWordPress(baseUrl: string, body: PublishBody): Promise<PublishResult | null> {
  try {
    console.log('[WP Publish] Trying direct WordPress API call...');
    const apiUrl = `${baseUrl}/wp-json/wp/v2/posts`;
    const authBase64 = btoa(`${body.username}:${body.appPassword}`);

    const authHeaders: Record<string, string> = {
      'Authorization': `Basic ${authBase64}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    let targetPostId: number | null = body.existingPostId || null;

    if (!targetPostId && body.slug) {
      try {
        const cleanSlug = body.slug.replace(/^\/+|\/+$/g, '').split('/').pop() || body.slug;
        const searchRes = await fetch(`${apiUrl}?slug=${encodeURIComponent(cleanSlug)}&status=any`, {
          headers: authHeaders,
          signal: AbortSignal.timeout(15000),
        });
        if (searchRes.ok) {
          const posts = await searchRes.json();
          if (Array.isArray(posts) && posts.length > 0) {
            targetPostId = posts[0].id;
          }
        }
      } catch {}
    }

    if (!targetPostId && body.sourceUrl) {
      try {
        const pathMatch = body.sourceUrl.match(/\/([^/]+)\/?$/);
        if (pathMatch) {
          const sourceSlug = pathMatch[1].replace(/\/$/, '');
          const searchRes = await fetch(`${apiUrl}?slug=${encodeURIComponent(sourceSlug)}&status=any`, {
            headers: authHeaders,
            signal: AbortSignal.timeout(15000),
          });
          if (searchRes.ok) {
            const posts = await searchRes.json();
            if (Array.isArray(posts) && posts.length > 0) {
              targetPostId = posts[0].id;
            }
          }
        }
      } catch {}
    }

    const postData: Record<string, unknown> = {
      title: body.title,
      content: body.content,
      status: body.status,
    };

    if (body.excerpt) postData.excerpt = body.excerpt;
    if (body.slug) {
      postData.slug = body.slug.replace(/^\/+|\/+$/g, '').split('/').pop() || body.slug;
    }
    if (body.metaDescription || body.seoTitle) {
      postData.meta = {
        _yoast_wpseo_metadesc: body.metaDescription || '',
        _yoast_wpseo_title: body.seoTitle || body.title,
        rank_math_description: body.metaDescription || '',
        rank_math_title: body.seoTitle || body.title,
        _aioseo_description: body.metaDescription || '',
        _aioseo_title: body.seoTitle || body.title,
      };
    }

    const targetUrl = targetPostId ? `${apiUrl}/${targetPostId}` : apiUrl;
    const method = targetPostId ? 'PUT' : 'POST';

    const response = await fetch(targetUrl, {
      method,
      headers: authHeaders,
      body: JSON.stringify(postData),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => '');
      let errorMessage = `WordPress API error: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {}

      if (response.status === 401) {
        errorMessage = 'Authentication failed. Check your username and application password.';
      } else if (response.status === 403) {
        errorMessage = 'Permission denied. Ensure the user has publish capabilities.';
      } else if (response.status === 404) {
        errorMessage = 'WordPress REST API not found. Ensure permalinks are enabled.';
      }

      return { success: false, error: errorMessage };
    }

    const post = await response.json();
    return {
      success: true,
      postId: post.id,
      postUrl: post.link,
    };
  } catch (error) {
    console.warn('[WP Publish] Direct call failed, falling back to proxy:', error);
    return null;
  }
}

async function publishViaProxy(
  url: string,
  body: PublishBody,
  extraHeaders: Record<string, string>,
  label: string,
): Promise<PublishResult | null> {
  try {
    console.log(`[WP Publish] Trying ${label} proxy: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn(`[WP Publish] ${label} returned non-JSON (${contentType}), skipping`);
      return null;
    }

    if (response.status === 404 || response.status === 405) {
      console.warn(`[WP Publish] ${label} returned ${response.status}, skipping`);
      return null;
    }

    const data = await response.json();

    if (!data.success) {
      const serverError = data.error as string || '';
      const statusCode = data.status as number;
      let errorMsg = serverError || 'Failed to publish to WordPress';

      if (statusCode === 401 || serverError.includes('Authentication')) {
        errorMsg = 'WordPress authentication failed. Check your username and application password in Setup.';
      } else if (statusCode === 403) {
        errorMsg = 'Permission denied. Ensure the WordPress user has publishing capabilities.';
      } else if (statusCode === 404) {
        errorMsg = 'WordPress REST API not found. Ensure permalinks are enabled.';
      }

      return { success: false, error: errorMsg };
    }

    const post = data.post as Record<string, unknown> | undefined;
    return {
      success: true,
      postId: post?.id as number | undefined,
      postUrl: post?.url as string | undefined,
    };
  } catch (error) {
    console.warn(`[WP Publish] ${label} proxy failed:`, error);
    return null;
  }
}
