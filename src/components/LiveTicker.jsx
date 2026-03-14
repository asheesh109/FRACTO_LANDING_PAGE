import React, { useState, useEffect } from 'react'
import { getLatestClaims, subscribeToNewClaims } from '../lib/supabase'
import VerdictBadge from './VerdictBadge'

// Fallback data shown while loading or if DB is empty
const FALLBACK = [
  { id:'1', title:'WhatsApp forward claims lemon water cures diabetes — reviewed', verdict:'FALSE',      category:'Health' },
  { id:'2', title:'Viral image of flood shows 2019 footage being recirculated',    verdict:'MISLEADING', category:'Weather' },
  { id:'3', title:'PIB confirms government scheme details in viral post are accurate', verdict:'TRUE',   category:'Government' },
  { id:'4', title:'Unverified claim about bank merger circulating on Telegram',     verdict:'UNVERIFIED',category:'Finance' },
  { id:'5', title:'Morphed political rally photo identified via reverse image search',verdict:'FALSE',   category:'Politics' },
]

const PLATFORM_ICONS = {
  whatsapp:  'whatsapp-logo',
  twitter:   'twitter-logo',
  instagram: 'instagram-logo',
  telegram:  'telegram-logo',
  facebook:  'facebook-logo',
  youtube:   'youtube-logo',
}

export default function LiveTicker() {
  const [items, setItems] = useState(FALLBACK)
  const [flash, setFlash] = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Load real claims from DB
    getLatestClaims(10).then(data => {
      if (data?.length) { setItems(data); setConnected(true) }
    }).catch(() => {})

    // Subscribe to new claims in realtime
    const unsub = subscribeToNewClaims(claim => {
      setItems(prev => [claim, ...prev.slice(0, 14)])
      setFlash(true)
      setTimeout(() => setFlash(false), 2000)
    })
    return () => unsub?.()
  }, [])

  const all = [...items, ...items] // doubled for seamless loop

  return (
    <div className="bg-[#eff6ff] border-b border-[#bfdbfe] h-10 flex items-center overflow-hidden select-none">
      {/* LIVE label */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 border-r border-[#bfdbfe] h-full bg-[#2563eb]">
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${flash ? 'bg-[#f97316]' : 'bg-white'}`}></span>
        <span className="font-mono text-[10px] text-white tracking-widest uppercase font-semibold">Live</span>
      </div>

      {/* Scrolling strip */}
      <div className="flex-1 overflow-hidden">
        <div className="ticker-track">
          {all.map((item, i) => (
            <span key={`${item.id}-${i}`} className="inline-flex items-center gap-3 px-6">
              {/* Platform icon if available */}
              {item.platform && PLATFORM_ICONS[item.platform?.toLowerCase()] && (
                <i className={`ph ph-${PLATFORM_ICONS[item.platform.toLowerCase()]} text-[11px] text-gray-500`}></i>
              )}
              <span className="text-[10px] font-mono font-semibold text-[#2563eb] uppercase tracking-wider">
                {item.category}
              </span>
              <span className="text-[12px] font-medium text-[#1e293b]">{item.title}</span>
              <VerdictBadge verdict={item.verdict} size="sm" />
              {item.risk != null && item.risk >= 7 && (
                <span className="font-mono text-[9px] text-red-500 font-bold">RISK {item.risk?.toFixed(1)}</span>
              )}
              <span className="text-[#bfdbfe] text-xs px-1">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Connection status dot */}
      <div className="flex-shrink-0 px-3 hidden sm:flex items-center">
        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`}
             title={connected ? 'Connected to live data' : 'Using cached data'} />
      </div>
    </div>
  )
}