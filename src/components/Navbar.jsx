import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from './SearchBar'
import GetStartedModal from './Getstartedmodal'

const NAV = [
  { label:'Features',     href:'/#features' },
  { label:'How It Works', href:'/#how-it-works' },
  { label:'Pricing',      href:'/#pricing' },
  { label:'FAQ',          href:'/#faq' },
  { label:'Blog',         href:'/#blog' },
]

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [open, setOpen]           = useState(false)       // mobile menu
  const [modalOpen, setModalOpen] = useState(false)       // get started modal

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, {passive:true})
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white transition-all duration-200 ${scrolled ? 'shadow-[0_1px_20px_rgba(0,0,0,.08)]' : 'border-b border-[#e2e8f0]'}`}>
        <nav className="max-w-7xl mx-auto px-5 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[#2563eb] rounded-xl flex items-center justify-center group-hover:bg-[#1e40af] transition-colors shadow-[0_2px_8px_rgba(37,99,235,.3)]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5L15 5V13L9 16.5L3 13V5L9 1.5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M6.5 9L8.5 11L12 7" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display font-900 text-[#111318] text-xl tracking-tight">FRACTA</span>
          </Link>

          <ul className="hidden md:flex items-center gap-0.5">
            {NAV.map(n => (
              <li key={n.label}>
                <a href={n.href} className="nav-link px-4 py-2 text-sm font-medium text-[#3d4353] hover:text-[#111318] transition-colors rounded-lg hover:bg-slate-50">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            <SearchBar />
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 text-sm font-bold bg-[#2563eb] text-white rounded-xl hover:bg-[#1e40af] transition-colors shadow-[0_2px_8px_rgba(37,99,235,.25)]"
            >
              Get Started Free
            </button>
          </div>

          <button className="md:hidden p-2 text-[#3d4353]" onClick={() => setOpen(v => !v)}>
            <i className={`ph ph-${open ? 'x' : 'list'} text-xl`}></i>
          </button>
        </nav>

        {open && (
          <div className="md:hidden border-t border-[#e2e8f0] bg-white px-5 py-4 space-y-1">
            {NAV.map(n => (
              <a key={n.label} href={n.href}
                 className="block px-3 py-2.5 text-sm font-medium text-[#3d4353] hover:text-[#111318] hover:bg-slate-50 rounded-lg"
                 onClick={() => setOpen(false)}>{n.label}</a>
            ))}
            <div className="pt-3 border-t border-[#e2e8f0] space-y-2">
              <SearchBar />
              <button
                onClick={() => { setOpen(false); setModalOpen(true) }}
                className="block w-full text-center px-4 py-2.5 text-sm font-bold bg-[#2563eb] text-white rounded-xl"
              >
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </header>

      <GetStartedModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}