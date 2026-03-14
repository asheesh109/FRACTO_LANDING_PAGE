import { createClient } from '@supabase/supabase-js'

// ── Client ────────────────────────────────────────────────────────────────────
const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON   = import.meta.env.VITE_SUPABASE_ANON_KEY
export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'facta-blog-images'

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('[FRACTA] Supabase credentials missing — check your .env file.')
}

export const supabase = createClient(
  SUPABASE_URL  || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder-key',
  {
    realtime: { params: { eventsPerSecond: 10 } },
  }
)

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve a cover image URL.
 * - If it's already an http(s) URL → return as-is
 * - If it looks like a Cloudinary public_id → return via Cloudinary
 * - If it's a Supabase Storage path → return via storage
 * - Otherwise → null (component will show placeholder)
 */
export function resolveImageUrl(cover_image, cloudinary_public_id) {
  if (!cover_image && !cloudinary_public_id) return null

  // 1. Cloudinary public_id (has no slashes, no http) → CDN URL
  if (cloudinary_public_id) {
    return `https://res.cloudinary.com/fracta/image/upload/f_auto,q_auto,w_800/${cloudinary_public_id}`
  }

  if (cover_image) {
    // 2. Google Drive share/view links → direct embed URL
    //    Matches: drive.google.com/file/d/FILE_ID/...
    //             drive.google.com/open?id=FILE_ID
    const gdriveMatch = cover_image.match(
      /drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/
    )
    if (gdriveMatch) {
      return `https://drive.google.com/uc?export=view&id=${gdriveMatch[1]}`
    }

    // 3. Any other direct http(s) URL → pass through as-is
    if (cover_image.startsWith('http')) return cover_image

    // 4. Supabase Storage path → resolve to public URL
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(cover_image)
    return data?.publicUrl || null
  }

  return null
}

// ── Blog Posts ────────────────────────────────────────────────────────────────

/**
 * Fetch latest published blog posts.
 * Schema: blog_posts (id, title, slug, summary, verdict, category,
 *   risk_score, cover_image, cloudinary_public_id, created_at, published)
 */
export async function getBlogPosts(limit = 9) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, summary, verdict, category, risk_score, cover_image, cloudinary_public_id, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).map(p => ({
    ...p,
    cover_image: resolveImageUrl(p.cover_image, p.cloudinary_public_id),
  }))
}

/**
 * Fetch a single blog post by slug (includes full content + sources).
 */
export async function getBlogPostBySlug(slug) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) throw error
  return {
    ...data,
    cover_image: resolveImageUrl(data.cover_image, data.cloudinary_public_id),
    // Normalize sources: schema stores TEXT[] — convert to [{label, url}] shape
    sources: normalizeSources(data.sources),
  }
}

/**
 * Full-text search across blog post titles and summaries.
 */
export async function searchBlogPosts(term, limit = 5) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, verdict, category, created_at, risk_score')
    .eq('published', true)
    .or(`title.ilike.%${term}%,summary.ilike.%${term}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Increment view count for a blog post.
 */
export async function incrementViews(id) {
  await supabase.rpc('increment_blog_views', { post_id: id }).catch(() => {
    // fallback: direct update (requires RLS policy allowing anon update on views)
    supabase.from('blog_posts').update({ views: supabase.rpc('views + 1') }).eq('id', id).catch(() => {})
  })
}

// ── Claims (for LiveTicker + trending) ───────────────────────────────────────

/**
 * Fetch the latest verified claims for the live ticker.
 * Schema: claims (id, extracted_claim, raw_text, llm_verdict, ml_category,
 *   risk_score, platform, created_at, status)
 */
export async function getLatestClaims(limit = 10) {
  const { data, error } = await supabase
    .from('claims')
    .select('id, extracted_claim, raw_text, llm_verdict, ml_category, risk_score, platform, created_at')
    .in('status', ['APPROVED', 'PENDING'])
    .not('llm_verdict', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).map(c => ({
    id:       c.id,
    title:    c.extracted_claim || c.raw_text?.slice(0, 120) || 'Claim under review',
    verdict:  c.llm_verdict?.toUpperCase() || 'UNVERIFIED',
    category: c.ml_category || 'General',
    platform: c.platform,
    risk:     c.risk_score,
  }))
}

/**
 * Trending claims stats for the dashboard.
 */
export async function getTrendingStats() {
  const [totalRes, weekRes] = await Promise.all([
    supabase.from('claims').select('id', { count: 'exact', head: true }),
    supabase.from('claims')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])
  return {
    total:   totalRes.count   || 0,
    thisWeek: weekRes.count   || 0,
  }
}

// ── Realtime subscriptions ────────────────────────────────────────────────────

/**
 * Subscribe to new blog post inserts (published only).
 * Returns an unsubscribe function.
 */
export function subscribeToNewPosts(callback) {
  const channel = supabase
    .channel('fracta_blog_inserts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'blog_posts', filter: 'published=eq.true' },
      (payload) => callback(payload.new)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

/**
 * Subscribe to new claim verifications (for live ticker).
 * Returns an unsubscribe function.
 */
export function subscribeToNewClaims(callback) {
  const channel = supabase
    .channel('fracta_claims_inserts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'claims' },
      (payload) => {
        const c = payload.new
        callback({
          id:       c.id,
          title:    c.extracted_claim || c.raw_text?.slice(0, 120) || 'New claim verified',
          verdict:  c.llm_verdict?.toUpperCase() || 'UNVERIFIED',
          category: c.ml_category || 'General',
          platform: c.platform,
          risk:     c.risk_score,
        })
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Normalize sources field.
 * Backend stores as TEXT[] with strings like "Label|https://url" or just URLs.
 */
function normalizeSources(raw) {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((s, i) => {
    if (typeof s === 'object') return s
    if (s.includes('|')) {
      const [label, url] = s.split('|')
      return { label: label.trim(), url: url.trim() }
    }
    return { label: `Source ${i + 1}`, url: s }
  })
}