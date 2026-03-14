import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getBlogPostBySlug, getBlogPosts, incrementViews } from '../lib/supabase'
import VerdictBadge from '../components/VerdictBadge'
import BlogCard from '../components/BlogCard'

const MOCK_POST = {
  id: 'mock',
  slug: 'example-fact-check',
  title: 'Example: Viral health claim about common painkiller debunked',
  summary: 'A widely shared post claiming ibuprofen causes permanent liver damage has been reviewed by three independent medical institutions.',
  verdict: 'FALSE',
  category: 'Health',
  risk_score: 8.7,
  risk_level: 'HIGH',
  cover_image: null,
  created_at: new Date().toISOString(),
  auto_generated: true,
  content: `## Claim\n\nA viral WhatsApp post claims that taking ibuprofen more than once per week causes "permanent liver damage" and that this fact is being "suppressed by pharmaceutical companies."\n\n## What We Found\n\nThis claim is **false**. Ibuprofen is primarily processed by the kidneys, not the liver.\n\nThree independent institutions reviewed the claim:\n\n- **Mayo Clinic**: Found no peer-reviewed evidence linking standard ibuprofen use to permanent liver damage.\n- **Johns Hopkins Medical**: Confirmed ibuprofen's primary metabolism pathway is renal, not hepatic.\n- **WHO Drug Safety Database**: No liver damage signals flagged for standard ibuprofen dosing.\n\n## Verdict\n\nThis claim is **FALSE**. The mechanism described is medically inaccurate. Consult your doctor for any concerns about painkiller usage.\n`,
  sources: [
    { label: 'Mayo Clinic — Ibuprofen safety profile', url: 'https://www.mayoclinic.org' },
    { label: 'WHO Drug Safety Bulletin, Vol. 34',      url: 'https://www.who.int' },
    { label: 'Johns Hopkins Medical Review, 2023',     url: 'https://www.hopkinsmedicine.org' },
  ],
}

function RiskMeter({ score }) {
  const pct   = score > 10 ? score : score * 10
  const color = pct >= 70 ? '#ef4444' : pct >= 40 ? '#f97316' : '#16a34a'
  const label = pct >= 70 ? 'High'    : pct >= 40 ? 'Moderate' : 'Low'
  return (
    <div className="space-y-1.5" aria-label={`Risk score: ${score} out of 10`}>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Risk Score</span>
        <span className="font-semibold" style={{color}}>
          {score > 10 ? score : score.toFixed(1)}/10 — <span className="uppercase">{label}</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar"
           aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-all duration-500"
             style={{width:`${pct}%`, backgroundColor: color}} />
      </div>
    </div>
  )
}

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost]           = useState(null)
  const [relatedPosts, setRelated] = useState([])
  const [loading, setLoading]     = useState(true)
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    Promise.all([
      getBlogPostBySlug(slug).catch(() => MOCK_POST),
      getBlogPosts(4).catch(() => []),
    ]).then(([postData, posts]) => {
      const resolved = postData || MOCK_POST
      setPost(resolved)
      setRelated(posts.filter(p => p.slug !== slug).slice(0, 3))
      if (resolved.id !== 'mock') incrementViews(resolved.id).catch(() => {})
    }).catch(() => {
      setPost(MOCK_POST)
    }).finally(() => setLoading(false))
  }, [slug])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
        <div className="h-6 bg-gray-100 rounded mb-3 w-1/3" />
        <div className="h-8 bg-gray-100 rounded mb-4 w-3/4" />
        <div className="h-4 bg-gray-100 rounded mb-2" />
        <div className="h-4 bg-gray-100 rounded mb-8 w-2/3" />
        <div className="aspect-video bg-gray-100 rounded-xl mb-8" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
        </div>
      </main>
    )
  }

  if (!post) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <i className="ph ph-newspaper text-5xl text-gray-200 mb-4 block"></i>
        <h1 className="text-2xl font-semibold text-[#111318] mb-3">Article not found</h1>
        <p className="text-gray-500 mb-6">This fact-check doesn't exist or has been removed.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563eb] hover:underline">
          ← Back to home
        </Link>
      </main>
    )
  }

  const sources = Array.isArray(post.sources) ? post.sources : []
  const dateStr = post.created_at
    ? format(new Date(post.created_at), 'MMMM d, yyyy')
    : ''

  return (
    <main>
      {/* ── Back button — very top, full width bar ── */}
      <div className="border-b border-[#e2e8f0] bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            to="/#blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#3d4353] hover:text-[#111318] transition-colors group"
          >
            <i className="ph ph-arrow-left text-base group-hover:-translate-x-0.5 transition-transform"></i>
            Back to all blogs
          </Link>
          {/* Breadcrumb */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
            <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <i className="ph ph-caret-right text-[10px]"></i>
            <Link to="/#blog" className="hover:text-gray-600 transition-colors">Blog</Link>
            <i className="ph ph-caret-right text-[10px]"></i>
            <span className="text-gray-500 truncate max-w-[200px]">{post.title}</span>
          </nav>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10" aria-labelledby="article-title">

        {/* Verdict + category + AI badge */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <VerdictBadge verdict={post.verdict} size="lg" />
          {post.category && (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {post.category}
            </span>
          )}
          {post.auto_generated && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#f97316] bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
              <i className="ph ph-robot text-xs"></i> AI-generated
            </span>
          )}
          {post.risk_level && (
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full
              ${post.risk_level === 'HIGH'   ? 'bg-red-50 text-red-600 border border-red-100' :
                post.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                               'bg-green-50 text-green-600 border border-green-100'}`}>
              {post.risk_level} RISK
            </span>
          )}
        </div>

        {/* Title */}
        <h1 id="article-title" className="font-display font-900 text-2xl sm:text-3xl text-[#111318] leading-tight mb-4">
          {post.title}
        </h1>

        {/* Summary */}
        {post.summary && (
          <p className="text-base text-[#3d4353] leading-relaxed mb-6 border-l-4 border-[#2563eb] pl-4">
            {post.summary}
          </p>
        )}

        {/* Info bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[#e2e8f0] mb-8">
          <div className="flex flex-wrap items-center gap-5">
            {dateStr && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <i className="ph ph-calendar text-base"></i>
                <time dateTime={post.created_at}>{dateStr}</time>
              </div>
            )}
            {post.risk_score != null && (
              <div className="w-44">
                <RiskMeter score={post.risk_score} />
              </div>
            )}
            {post.views > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <i className="ph ph-eye text-base"></i>
                <span>{post.views.toLocaleString()} views</span>
              </div>
            )}
          </div>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold border border-[#e2e8f0] rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
          >
            <i className="ph ph-share-network text-sm"></i>
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        {/* Cover image */}
        {post.cover_image && (
          <figure className="mb-8">
            <img
              src={post.cover_image}
              alt={`Cover image for: ${post.title}`}
              className="w-full rounded-2xl border border-[#e2e8f0] object-cover aspect-video"
              loading="eager"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={e => { e.currentTarget.parentElement.style.display = 'none' }}
            />
          </figure>
        )}

        {/* Markdown content */}
        <div className="prose prose-gray max-w-none
          prose-headings:font-display prose-headings:font-800 prose-headings:text-[#111318]
          prose-p:text-[#3d4353] prose-p:leading-relaxed
          prose-a:text-[#2563eb] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-[#111318]
          prose-code:text-sm prose-code:bg-[#f8fafc] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-[#e2e8f0]
          prose-blockquote:border-l-[#2563eb] prose-blockquote:text-[#3d4353]
          prose-li:text-[#3d4353]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content || MOCK_POST.content}
          </ReactMarkdown>
        </div>

        {/* Corrective response */}
        {post.corrective_response && (
          <div className="mt-8 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
            <div className="flex items-start gap-3">
              <i className="ph ph-info text-[#2563eb] text-xl flex-shrink-0 mt-0.5"></i>
              <div>
                <h3 className="font-display font-800 text-sm text-[#111318] mb-1.5">Corrective Response</h3>
                <p className="text-sm text-[#3d4353] leading-relaxed">{post.corrective_response}</p>
              </div>
            </div>
          </div>
        )}

        {/* Evidence sources */}
        {sources.length > 0 && (
          <aside className="mt-8 p-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl">
            <h2 className="font-display font-800 text-sm text-[#111318] mb-4 flex items-center gap-2">
              <i className="ph ph-books text-[#2563eb] text-base"></i>
              Sources & Evidence ({sources.length})
            </h2>
            <ol className="space-y-2">
              {sources.map((src, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="font-mono text-[10px] text-gray-400 mt-0.5 w-5 flex-shrink-0">{i + 1}.</span>
                  <a href={src.url} target="_blank" rel="noopener noreferrer"
                     className="text-[#2563eb] hover:underline leading-relaxed break-all">
                    {src.label || src.url}
                  </a>
                </li>
              ))}
            </ol>
          </aside>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-[#f8fafc] border-t border-[#e2e8f0] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-1 bg-[#2563eb] rounded" />
              <h2 className="font-display font-900 text-xl text-[#111318]">Related Fact Checks</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedPosts.map(p => <BlogCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}