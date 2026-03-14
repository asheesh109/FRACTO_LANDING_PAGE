import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { searchBlogPosts } from '../lib/supabase'
import VerdictBadge from './VerdictBadge'

export default function SearchBar() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [empty, setEmpty]     = useState(false)
  const containerRef = useRef(null)
  const timerRef     = useRef(null)

  const search = useCallback(async (term) => {
    if (!term.trim()) { setResults([]); setOpen(false); setEmpty(false); return }
    setLoading(true)
    setEmpty(false)
    try {
      const data = await searchBlogPosts(term, 6)
      setResults(data || [])
      setEmpty((data || []).length === 0)
      setOpen(true)
    } catch {
      setResults([])
      setEmpty(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const onChange = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 300)
  }

  useEffect(() => {
    const onOutside = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false) }
    const onEscape  = (e) => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg hover:border-gray-300 focus-within:border-[#2563eb] focus-within:bg-white transition-all">
        {loading
          ? <i className="ph ph-circle-notch text-sm text-gray-400 animate-spin"></i>
          : <i className="ph ph-magnifying-glass text-sm text-gray-400"></i>
        }
        <input
          type="search"
          placeholder="Search verdicts..."
          value={query}
          onChange={onChange}
          className="bg-transparent text-sm text-[#111318] placeholder-gray-400 outline-none w-36 lg:w-44"
          aria-label="Search fact-checks"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); setResults([]) }}
                  className="text-gray-300 hover:text-gray-500 transition-colors">
            <i className="ph ph-x text-xs"></i>
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl border border-[#e2e8f0] shadow-[0_8px_40px_rgba(37,99,235,.12)] overflow-hidden z-50"
          role="listbox"
        >
          {results.length > 0
            ? results.map(r => (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="flex items-start gap-3 p-3 hover:bg-[#f8fafc] border-b border-[#f1f5f9] last:border-0 transition-colors"
                  onClick={() => { setOpen(false); setQuery('') }}
                  role="option"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111318] line-clamp-1 mb-1.5">{r.title}</p>
                    <div className="flex items-center gap-2">
                      <VerdictBadge verdict={r.verdict} size="sm" />
                      {r.category && <span className="text-xs text-gray-400">{r.category}</span>}
                      {r.risk_score != null && (
                        <span className="font-mono text-[9px] text-gray-400 ml-auto">
                          risk {r.risk_score > 10 ? r.risk_score : (r.risk_score * 10).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            : empty && (
                <div className="px-4 py-6 text-center">
                  <i className="ph ph-magnifying-glass text-2xl text-gray-200 mb-2 block"></i>
                  <p className="text-sm text-gray-400">No results for "{query}"</p>
                </div>
              )
          }
          {results.length > 0 && (
            <div className="px-3 py-2 border-t border-[#f1f5f9] bg-[#f8fafc]">
              <p className="text-[10px] text-gray-400 text-center">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}