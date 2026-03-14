import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import VerdictBadge from './VerdictBadge'

export default function BlogCard({ post }) {
  const [imgError, setImgError] = useState(false)

  const dateStr = post.created_at
    ? format(new Date(post.created_at), 'd MMM yyyy')
    : ''

  const riskColor = post.risk_score >= 7
    ? '#ef4444'
    : post.risk_score >= 4
    ? '#f97316'
    : '#16a34a'

  // risk_score in schema is FLOAT 0–10; normalize to 0–100 for bar display
  const riskPct = post.risk_score != null
    ? (post.risk_score > 10 ? post.risk_score : post.risk_score * 10)
    : null

  const hasImage = post.cover_image && !imgError

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col border border-[#e2e8f0] rounded-2xl overflow-hidden hover:shadow-[0_12px_40px_rgba(37,99,235,.1)] hover:-translate-y-1 transition-all duration-300 bg-white"
    >
      {/* Cover image */}
      <div className="h-44 bg-[#f8fafc] overflow-hidden relative flex-shrink-0">
        {hasImage ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Placeholder — category-coloured gradient */
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
               style={{background:'linear-gradient(135deg,#eff6ff 0%,#f8fafc 100%)'}}>
            <i className="ph ph-newspaper text-4xl text-[#bfdbfe]"></i>
            {post.category && (
              <span className="text-[10px] font-mono font-semibold text-[#93c5fd] uppercase tracking-wider">
                {post.category}
              </span>
            )}
          </div>
        )}

        {/* Verdict badge */}
        <div className="absolute top-3 left-3">
          <VerdictBadge verdict={post.verdict} size="sm" />
        </div>

        {/* AI-generated badge */}
        {post.auto_generated && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-orange-100">
            <i className="ph ph-robot text-[9px] text-[#f97316]"></i>
            <span className="text-[8px] font-bold text-gray-600">AI Generated</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          {post.category && <span className="eyebrow">{post.category}</span>}
          {dateStr && <span className="text-xs text-gray-400 font-mono ml-auto">{dateStr}</span>}
        </div>

        <h3 className="font-display font-bold text-[#111318] text-[15px] leading-snug mb-3 line-clamp-2 group-hover:text-[#2563eb] transition-colors">
          {post.title}
        </h3>

        {post.summary && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1">
            {post.summary}
          </p>
        )}

        {riskPct != null && (
          <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">Risk Score</span>
              <span className="font-mono text-xs font-semibold" style={{color: riskColor}}>
                {post.risk_score > 10 ? post.risk_score : (post.risk_score * 10).toFixed(0)}/100
              </span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                   style={{width:`${riskPct}%`, background: riskColor}} />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}