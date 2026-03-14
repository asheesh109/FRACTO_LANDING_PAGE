import React, { useEffect, useRef } from 'react'

// ── URLs — update these when you publish ───────────────────────────────────
const APK_URL        = 'https://github.com/asheesh109/FRACTO_LANDING_PAGE/releases/download/v1.0/factra.apk'           // served from /public/downloads/
const EXTENSION_URL  = 'https://github.com/asheesh109/FRACTO_LANDING_PAGE/releases/download/v1.1/fracto-extension.zip' // packed .crx or .zip
const GOVT_URL       = 'https://fracta-gov.vercel.app'         // government admin portal

const OPTIONS = [
  {
    id:    'apk',
    icon:  'device-mobile',
    color: '#16a34a',
    bg:    '#f0fdf4',
    border:'#bbf7d0',
    title: 'Android App',
    desc:  'Download the FRACTA app directly to your Android device.',
    cta:   'Download APK',
    ctaIcon:'download-simple',
    action: 'download',
  },
  {
    id:    'extension',
    icon:  'puzzle-piece',
    color: '#2563eb',
    bg:    '#eff6ff',
    border:'#bfdbfe',
    title: 'Chrome Extension',
    desc:  'Fact check anything on the web without leaving your browser.',
    cta:   'Add to Chrome',
    ctaIcon:'plus-circle',
    action: 'extension',
  },
  {
    id:    'govt',
    icon:  'buildings',
    color: '#f97316',
    bg:    '#fff7ed',
    border:'#fed7aa',
    title: 'Government Portal',
    desc:  'Admin dashboard for government departments and operators.',
    cta:   'Open Portal',
    ctaIcon:'arrow-square-out',
    action: 'link',
    href:  GOVT_URL,
  },
]

export default function GetStartedModal({ open, onClose }) {
  const overlayRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', fn)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleAction = (opt) => {
    if (opt.action === 'download') {
      // Trigger file download
      const a = document.createElement('a')
      a.href = APK_URL
      a.download = 'fracta.apk'
      a.click()
    } else if (opt.action === 'extension') {
      // For a packed .crx: navigate to the file — Chrome prompts install
      // For a .zip with instructions: download it
      const a = document.createElement('a')
      a.href = EXTENSION_URL
      a.download = 'fracta-extension.zip'
      a.click()
    } else if (opt.action === 'link') {
      window.open(opt.href, '_blank', 'noopener,noreferrer')
    }
    onClose()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#111318]/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,.22)] w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#e2e8f0]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 bg-[#2563eb] rounded-xl flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1.5L15 5V13L9 16.5L3 13V5L9 1.5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M6.5 9L8.5 11L12 7" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-display font-900 text-[#111318] text-lg">Get FRACTA</span>
              </div>
              <p className="text-sm text-gray-500">Choose how you want to use FRACTA</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#111318] hover:bg-gray-100 transition-all"
            >
              <i className="ph ph-x text-base"></i>
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="px-8 py-6 space-y-3">
          {OPTIONS.map(opt => (
            <div
              key={opt.id}
              className="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,.06)] transition-all group"
              style={{ background: opt.bg, borderColor: opt.border }}
              onClick={() => handleAction(opt)}
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: opt.color + '18', border: `1px solid ${opt.color}30` }}>
                <i className={`ph ph-${opt.icon} text-xl`} style={{ color: opt.color }}></i>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-display font-800 text-[#111318] text-sm mb-0.5">{opt.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0">
                <span
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: opt.color }}
                >
                  <i className={`ph ph-${opt.ctaIcon} text-sm`}></i>
                  {opt.cta}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="px-8 pb-7">
          <p className="text-[11px] text-gray-400 text-center">
            All products are free to start · No credit card required
          </p>
        </div>
      </div>
    </div>
  )
}
