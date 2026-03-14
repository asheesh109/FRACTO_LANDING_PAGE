import React from 'react'

const COLS = {
  Menu: ['About Us', 'Team', 'FAQ', 'Blog', 'Careers'],
  Platform: ['Text Verify', 'Image Verify', 'URL Check', 'Voice Verify', 'API Access'],
  Pages: ['Dashboard', 'Operator Portal', 'Docs'],
  Others: ['Methodology', 'Changelog', 'Status Page'],
}

export default function Footer() {
  return (
    <footer className="bg-[#111318]">
      <div className="max-w-7xl mx-auto px-5 lg:px-10 pt-14 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-10 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#2563eb] rounded-xl flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1.5L15 5V13L9 16.5L3 13V5L9 1.5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M6.5 9L8.5 11L12 7" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-display font-900 text-white text-xl">FRACTA</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
              India's real time AI misinformation defense. Verify claims in 2+ languages across all platforms.
            </p>
            <div className="flex gap-2.5">
              {['twitter-logo', 'linkedin-logo', 'github-logo', 'telegram-logo'].map(ic => (
                <a key={ic} href="#" className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                  <i className={`ph ph-${ic} text-base`}></i>
                </a>
              ))}
            </div>
          </div>
          {Object.entries(COLS).map(([col, items]) => (
            <div key={col}>
              <h4 className="text-white font-bold text-sm mb-4">{col}</h4>
              <ul className="space-y-2.5">
                {items.map(it => (
                  <li key={it}><a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">{it}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} FRACTA. Built for India. Powered by AI.</p>
          <p className="text-xs font-mono text-gray-700">v2.0.0 Gemini 2.0 Flash + Qwen 2.5 72B</p>
        </div>
      </div>
    </footer>
  )
}