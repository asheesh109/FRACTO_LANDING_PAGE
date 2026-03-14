import React, { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { getBlogPosts } from '../lib/supabase'
import BlogCard from '../components/BlogCard'
import LiveTicker from '../components/LiveTicker'
import GetStartedModal from '../components/Getstartedmodal'

// Context so any section can open the modal without prop drilling
const ModalCtx = React.createContext(() => {})

/* ─── Static data ─── */

const PLATFORMS = [
  { icon:'whatsapp-logo', name:'WhatsApp',  color:'#25D366' },
  { icon:'twitter-logo',  name:'Twitter/X', color:'#000000' },
  { icon:'instagram-logo',name:'Instagram', color:'#E1306C' },
  { icon:'telegram-logo', name:'Telegram',  color:'#2CA5E0' },
  { icon:'facebook-logo', name:'Facebook',  color:'#1877F2' },
  { icon:'youtube-logo',  name:'YouTube',   color:'#FF0000' },
]

const FEATURES = [
  { icon:'brain',                label:'AI Pipeline',     title:'Qwen + Gemini RAG',          desc:'12-step verification: Qwen-2.5-72B pre-analyzes 9 web sources, Gemini 2.0 Flash delivers the final verdict with sources, reasoning, and confidence scores.',  stat:'98.4%',  sl:'accuracy' },
  { icon:'globe-hemisphere-east',label:'India-First',     title:'2+ Regional Languages',      desc:'Hindi, English, Marathi. Sarvam AI handles speech. Corrective responses returned in the original claim language.',                                             stat:'2+',     sl:'languages' },
  { icon:'pulse',                label:'Real-Time',       title:'Sub-3 Second Detection',     desc:'TF-IDF duplicate detection + Redis caching means repeated claims return instantly. New viral claims get flagged before they spread further.',                   stat:'< 3s',   sl:'detection' },
  { icon:'image-square',         label:'Multi-Modal',     title:'Text, Image, URL & Voice',   desc:'Gemini spots fake government logos and morphed faces. Sarvam AI transcribes voice claims and returns audio corrective responses in native language.',           stat:'4',      sl:'modalities' },
]

const STEPS = [
  { n:'01', icon:'upload-simple',  title:'Submit a Claim',         desc:'Text, image, URL, or voice via web, API, or WhatsApp bot.' },
  { n:'02', icon:'magnifying-glass',title:'9-Source RAG Scrape',   desc:'AltNews, BoomLive, PIB, DuckDuckGo, Google CSE, Reddit & more — in parallel.' },
  { n:'03', icon:'cpu',            title:'Qwen + Gemini Analysis',  desc:'Chain-of-thought reasoning on evidence, then Gemini final verdict.' },
  { n:'04', icon:'shield-check',   title:'Verdict + Risk Report',  desc:'Score 0–10, virality estimate, auto-generated blog post for high-risk claims.' },
]

const USE_CASES = [
  { icon:'pen-nib',   role:'Journalists',     desc:'Verify before publishing. Full source trail and confidence score every time.' },
  { icon:'broadcast', role:'Newsrooms',        desc:'Operator dashboard with trending categories and emerging narrative clusters.' },
  { icon:'users',     role:'Public',           desc:'Paste any WhatsApp forward. Get a plain-language verdict in seconds, free.' },
  { icon:'buildings', role:'Government',       desc:'PIB-verified claims get confidence boost. Monitor coordinated campaigns in real-time.' },
]

const PLANS = [
  { name:'Free',       priceM:0,     priceY:0,     sub:'20 checks maximum.',                                              highlight:false, cta:'Start Free',         features:['20 checks maximum','Verdict + risk score','Community feed','Email support'] },
  { name:'Pro',        priceM:199,   priceY:149,   sub:'Unlimited checks, detailed reports, persistent memory.',          highlight:true,  cta:'Start 15-day Trial', features:['Unlimited checks','Detailed reports','Persistent memory','Virality scores'] },
  { name:'Government', priceM:50000, priceY:37500, sub:'Admin dashboard, API access, secure department integration.',     highlight:false, cta:'Contact Sales',      features:['Admin dashboard','API access','Secure dept integration','SLA guarantee'] },
]

const FAQS = [
  { q:'How does FRACTA verify claims?',        a:'A 12-step pipeline: duplicate check → language detect → ML classification → parallel RAG scraping of 9 sources → Qwen chain-of-thought pre-analysis → Gemini 2.0 Flash final verdict → risk scoring → virality estimation. Under 3 seconds for most claims.' },
  { q:'Which Indian languages are supported?', a:'Hindi, English, Marathi. Sarvam AI handles detection, translation, TTS. Corrective responses return in the original language.' },
  { q:'How accurate is the AI?',               a:'98.4% on benchmarks. Confidence scores are always shown. When ML and Gemini disagree by > 20%, the claim is flagged for human operator review.' },
  { q:'Can I access data via API?',            a:'Yes. Pro and Government plans get JSON responses with: claim, verdict, risk score, risk level, virality estimate, social threat score, evidence sources, and reasoning steps.' },
  { q:'What triggers an auto-generated blog?', a:'Claims with risk score ≥ 6.0 and a non-TRUE verdict trigger async blog generation: Gemini writes markdown, Replicate SDXL generates the header image, Cloudinary hosts it.' },
  { q:'Is WhatsApp forwarding supported?',     a:'Yes. FRACTA applies a 1.3× virality multiplier for WhatsApp — the highest of any platform. Government plans include a native WhatsApp bot integration.' },
]

const MOCK_POSTS = [
  { id:'1', slug:'lemon-diabetes-debunked',  title:'WhatsApp forward claiming lemon water cures diabetes debunked by AIIMS', summary:'Viral forward reaching 2M+ users reviewed by three independent medical institutions.', verdict:'FALSE',     category:'Health',     risk_score:9.1, cover_image:null, created_at:new Date().toISOString(), auto_generated:true },
  { id:'2', slug:'election-data-misleading', title:'Viral election turnout figures omit crucial state-level context',          summary:'Numbers circulating across Twitter and WhatsApp show national turnout without the denominator.', verdict:'MISLEADING', category:'Politics',   risk_score:7.4, cover_image:null, created_at:new Date(Date.now()-86400000).toISOString(), auto_generated:true },
  { id:'3', slug:'pib-scheme-verified',      title:'PIB confirms PM Awas Yojana expansion figures cited in viral post',       summary:'Cross-referenced against official PIB press releases and confirmed accurate.',                 verdict:'TRUE',       category:'Government', risk_score:0.8, cover_image:null, created_at:new Date(Date.now()-172800000).toISOString(), auto_generated:false },
]

/* ─── Phone Screen SVG (replicating app mockup) ─── */
function PhoneVerificationScreen() {
  return (
    <div className="relative bg-white rounded-[40px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,.22)] border border-gray-200" style={{width:240, minHeight:520}}>
      {/* Notch */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-28 h-7 bg-[#111318] rounded-b-2xl z-10" />
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-10 pb-2 bg-white">
        <span className="font-mono text-[10px] font-semibold text-gray-800">9:41</span>
        <div className="flex items-center gap-1.5">
          <i className="ph ph-wifi-high text-[11px] text-gray-700"></i>
          <i className="ph ph-battery-full text-[11px] text-gray-700"></i>
        </div>
      </div>
      {/* App header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-display font-900 text-sm text-[#111318]">FRACTA</span>
        <i className="ph ph-list text-base text-gray-500"></i>
      </div>
      {/* Content */}
      <div className="px-3 py-4 space-y-3">
        <h2 className="font-display font-800 text-sm text-[#111318] leading-tight tracking-wide">CLAIM VERIFICATION RESULT</h2>
        {/* Verdict badge */}
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Verdict badge</p>
          <div className="flex items-center gap-2 px-3 py-3 bg-red-50 border border-red-200 rounded-2xl">
            <i className="ph ph-x-circle text-red-600 text-xl"></i>
            <span className="font-display font-900 text-red-600 text-lg">FALSE</span>
          </div>
        </div>
        {/* Risk score */}
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Risk score indicator</p>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
            <div className="flex items-end gap-1.5 justify-center mb-2">
              {[18,28,36,44,52].map((h,i) => (
                <div key={i} className="w-8 rounded-t-md" style={{height: h, background: i < 2 ? '#fcd34d' : i < 4 ? '#fb923c' : '#dc2626'}} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-gray-400 px-1">
              <span>Low</span><span>Moderate</span><span>High</span>
            </div>
          </div>
        </div>
        {/* Evidence */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Evidence sources</p>
          {['AltNews', 'BoomLive', 'PIB India'].map((s) => (
            <div key={s} className="flex items-center gap-1.5 py-1 border-b border-gray-100 last:border-0">
              <i className="ph ph-check-circle text-green-500 text-sm"></i>
              <span className="text-[10px] font-medium text-gray-700">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PhoneClaimScreen() {
  return (
    <div className="relative bg-white rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.15)] border border-gray-200" style={{width:240,minHeight:500}}>
      <div className="flex items-center justify-between px-5 pt-6 pb-2 bg-white">
        <span className="font-mono text-[10px] text-gray-800">9:41</span>
        <div className="w-16 h-5 bg-gray-800 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
        <div className="flex items-center gap-1"><i className="ph ph-wifi-high text-[10px]"></i><i className="ph ph-battery-full text-[10px]"></i></div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-display font-900 text-sm text-[#111318]">FRACTA</span>
        <i className="ph ph-list text-base text-gray-500"></i>
      </div>
      <div className="px-3 py-3 space-y-3">
        <h2 className="font-display font-800 text-sm text-[#111318]">CLAIM VERIFICATION</h2>
        {/* Top row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-2">
            <p className="text-[8px] text-gray-400 mb-1.5">Verdict badge</p>
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg">
              <i className="ph ph-warning text-amber-600 text-[10px]"></i>
              <span className="font-bold text-amber-700 text-[9px]">MISLEADING</span>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-2">
            <p className="text-[8px] text-gray-400 mb-1">Risk indicator</p>
            <div className="flex items-end gap-0.5 mt-1">
              {[3,5,6.5,8,9.5].map((h,i) => (
                <div key={i} className="flex-1 rounded-t-sm" style={{height: h*2.8, background: i < 2 ? '#fcd34d' : i < 4 ? '#fb923c' : '#dc2626'}} />
              ))}
            </div>
            <div className="flex justify-between text-[7px] text-gray-300 mt-0.5">
              <span>Low</span><span>High</span>
            </div>
          </div>
        </div>
        {/* Summary card */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5">
          <p className="text-[9px] font-semibold text-gray-500 mb-1.5">Fact-check summary card</p>
          <p className="text-[9px] text-gray-500 leading-relaxed">The claim lacks crucial context. While the statistic cited is accurate, it omits the denominator, creating a false impression of the actual scale.</p>
        </div>
        {/* Sources */}
        <div>
          <p className="text-[9px] font-semibold text-gray-500 mb-1.5">Evidence sources list</p>
          {[
            { cat:'Credible Sources', name:'AltNews Investigation', url:'altne.ws/claim-check' },
            { cat:'Government',       name:'PIB Fact Check',        url:'pib.gov.in/factcheck' },
          ].map(s => (
            <div key={s.cat} className="mb-1.5">
              <p className="text-[8px] text-gray-400">{s.cat}</p>
              <div className="bg-white border border-gray-100 rounded-lg px-2 py-1.5">
                <p className="text-[9px] font-semibold text-[#111318]">{s.name}</p>
                <p className="text-[8px] text-blue-500">{s.url}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PhoneDashboardScreen() {
  return (
    <div className="relative bg-white rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.15)] border border-gray-200" style={{width:240,minHeight:480}}>
      <div className="flex items-center justify-between px-5 pt-6 pb-2 bg-white">
        <span className="font-mono text-[10px] text-gray-800">9:41</span>
        <div className="w-16 h-5 bg-gray-800 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
        <div className="flex items-center gap-1"><i className="ph ph-wifi-high text-[10px]"></i><i className="ph ph-battery-full text-[10px]"></i></div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-display font-900 text-sm text-[#111318]">FRACTA</span>
        <i className="ph ph-list text-base text-gray-500"></i>
      </div>
      <div className="px-3 py-3">
        <h2 className="font-display font-800 text-[11px] text-[#111318] mb-2">TRENDING MISINFORMATION DASHBOARD</h2>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2">
            <p className="text-[8px] text-blue-500 font-semibold">TOTAL FLAGS</p>
            <p className="font-display font-900 text-xl text-[#111318]">412</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-2">
            <p className="text-[8px] text-orange-500 font-semibold">NEW THIS WEEK</p>
            <p className="font-display font-900 text-xl text-[#111318]">57</p>
          </div>
        </div>
        <p className="text-[9px] font-semibold text-gray-500 mb-2">Categories</p>
        {[
          { cat:'HEALTH MISINFORMATION', color:'bg-red-100 text-red-700', items:[{t:'Claim about vaccine side effects',f:189},{t:'Cure for common cold claim',f:51}] },
          { cat:'SCAM ALERTS',           color:'bg-amber-100 text-amber-700', items:[{t:'Phishing email as bank notice',f:145},{t:'Fake investment opportunity',f:98}] },
          { cat:'POLITICAL CLAIMS',      color:'bg-blue-100 text-blue-700', items:[{t:'Claim about election tampering',f:78}] },
        ].map(section => (
          <div key={section.cat} className="mb-2">
            <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-bold mb-1 ${section.color}`}>{section.cat}</div>
            {section.items.map(item => (
              <div key={item.t} className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-[8px] text-gray-600 flex-1 pr-2 leading-tight">{item.t}</span>
                <span className="font-mono text-[8px] font-bold text-gray-400 whitespace-nowrap">{item.f} flags</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}


/* ─── Helper: button that opens the GetStarted modal ─── */
function OpenModalBtn({ children, className, skip, href }) {
  const openModal = React.useContext(ModalCtx)
  if (skip && href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  }
  return <button type="button" onClick={openModal} className={className}>{children}</button>
}

/* ─── HERO ─── */
function Hero() {
  return (
    <section id="hero" className="relative bg-white overflow-hidden">
      {/* Very subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{backgroundImage:'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize:'28px 28px', opacity:.4}} />
      {/* Blue glow top-right */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{background:'radial-gradient(ellipse, rgba(37,99,235,.06) 0%, transparent 70%)'}} />

      <div className="relative max-w-7xl mx-auto px-5 lg:px-10 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <div>
            <div className="flex items-center gap-2 mb-7 afu">
              <span className="pill-orange"><i className="ph ph-shield-warning"></i>India's #1 AI Fact-Checker</span>
            </div>

            <h1 className="font-display font-900 text-[clamp(2.6rem,5.5vw,4rem)] leading-[1.08] text-[#111318] mb-5 afu d1">
              Stop Misinformation<br />
              Before It<br />
              <span className="text-[#2563eb]">Spreads.</span>
            </h1>

            <p className="text-[17px] text-[#3d4353] leading-relaxed max-w-[480px] mb-8 afu d2">
              FRACTA's 12 step AI pipeline verifies viral claims across WhatsApp, Twitter, Instagram and 10+ platforms in under 3 seconds — in 2+ Indian languages.
            </p>

            {/* Check row */}
            <div className="flex flex-wrap gap-5 mb-9 afu d3">
              {['Free 15-day trial','Multi-language','Cancel anytime'].map(b => (
                <div key={b} className="flex items-center gap-2 text-sm font-semibold text-[#3d4353]">
                  <i className="ph ph-check-circle text-[#2563eb] text-base"></i>{b}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-10 afu d3">
              <OpenModalBtn className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#2563eb] text-white text-sm font-bold rounded-xl hover:bg-[#1e40af] transition-all shadow-[0_4px_20px_rgba(37,99,235,.35)]">
                Start Verifying Free 
              </OpenModalBtn>
              <a href="#how-it-works" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#111318] border-b-2 border-[#111318] pb-0.5 hover:text-[#2563eb] hover:border-[#2563eb] transition-colors">
                See how it works <i className="ph ph-caret-down text-xs"></i>
              </a>
            </div>

            {/* Platform pills */}
            <div className="afu d4">
              <p className="text-[11px] font-mono text-gray-400 tracking-widest uppercase mb-3">Monitors across</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <div key={p.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs font-semibold text-[#3d4353]">
                    <i className={`ph ph-${p.icon} text-sm`} style={{color:p.color}}></i>{p.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — 3 phone screens from mockup */}
          <div className="hidden lg:flex items-end justify-center gap-4 afu d2">
            {/* Left phone — tilted */}
            <div className="fl" style={{transform:'rotate(-6deg) translateY(20px)', animationDelay:'.3s'}}>
              <PhoneVerificationScreen />
            </div>
            {/* Centre phone — main, upright */}
            <div className="fl z-10" style={{animationDelay:'0s'}}>
              <PhoneClaimScreen />
            </div>
            {/* Right phone — tilted */}
            <div className="fl" style={{transform:'rotate(6deg) translateY(20px)', animationDelay:'.6s'}}>
              <PhoneDashboardScreen />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Trust Strip ─── */
function TrustStrip() {
  const logos = ['AltNews','BoomLive','FactCheck.in','PIB India','Reuters','AP News','IFCN']
  return (
    <section className="border-y border-[#e2e8f0] bg-[#f8fafc] py-10">
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <p className="text-center eyebrow text-gray-400 mb-6">Verified by & partnered with</p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
          {logos.map(n => (
            <div key={n} className="flex items-center gap-2 text-gray-400 hover:text-[#111318] transition-colors cursor-pointer group">
              <i className="ph ph-newspaper text-base group-hover:text-[#2563eb] transition-colors"></i>
              <span className="font-bold text-sm">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── App Preview (dashboard terminal mockup) ─── */
function AppPreview() {
  return (
    <section className="py-20 lg:py-28 bg-[#111318] overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* Left — text */}
          <div>
            <span className="eyebrow text-blue-400 mb-4 block">The FRACTA App</span>
            <h2 className="font-display font-900 text-4xl lg:text-5xl text-white leading-tight mb-5">
              See every verdict.<br/>Instantly.
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
              Clean, fast, and designed for real people — not just tech experts. Paste any claim, get a full evidence-backed verdict in seconds.
            </p>
            <div className="space-y-3">
              {[
                { icon:'lightning', text:'Sub-3s detection on most claims' },
                { icon:'translate', text:'Responds in original Indian language' },
                { icon:'article',   text:'Auto-generates blog for high-risk verdicts' },
              ].map(f => (
                <div key={f.text} className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <i className={`ph ph-${f.icon} text-[#2563eb] text-sm`}></i>
                  </div>
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard/terminal mockup */}
          <div className="relative">
            {/* Main panel */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_24px_80px_rgba(0,0,0,.4)] overflow-hidden">
              {/* Browser top bar */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#e2e8f0] bg-[#f8fafc]">
                <div className="flex gap-1.5">
                  {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{background:c}} />)}
                </div>
                <div className="flex-1 mx-3 bg-white border border-[#e2e8f0] rounded-md h-6 flex items-center px-2 gap-1.5">
                  <i className="ph ph-lock-simple text-[10px] text-gray-400"></i>
                  <span className="text-[10px] font-mono text-gray-400">fracta.in/verify</span>
                </div>
              </div>

              <div className="p-5">
                {/* Claim input */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ph ph-whatsapp-logo text-[#25D366] text-sm"></i>
                    <span className="font-mono text-[9px] text-gray-400 tracking-widest">WHATSAPP FORWARD · 2.4M SHARES</span>
                  </div>
                  <p className="text-[13px] text-[#111318] leading-relaxed">
                    "New government scheme gives ₹50,000 to all families earning under ₹3 lakh. Apply before 31st March on this link..."
                  </p>
                </div>

                {/* Pipeline steps */}
                <div className="space-y-1.5 mb-4">
                  {[
                    { step:'Language Detected',  val:'Hindi → English', done:true },
                    { step:'RAG Sources Scraped', val:'9 sources · 0.8s', done:true },
                    { step:'Qwen Pre-Analysis',   val:'FALSE (0.91)',    done:true },
                    { step:'Gemini Verification', val:'Finalizing...',   done:false },
                  ].map(s => (
                    <div key={s.step} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#f8fafc]">
                      <div className="flex items-center gap-2">
                        {s.done
                          ? <i className="ph ph-check-circle text-green-500 text-sm"></i>
                          : <i className="ph ph-circle-notch text-[#2563eb] text-sm animate-spin"></i>}
                        <span className="text-[11px] text-gray-600">{s.step}</span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">{s.val}</span>
                    </div>
                  ))}
                </div>

                {/* Verdict block */}
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                      <i className="ph ph-x-circle text-red-600 text-lg"></i>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-gray-400 mb-0.5">VERDICT</p>
                      <p className="font-bold text-red-700 text-sm">FALSE — Scam Link Detected</p>
                      <p className="text-[10px] text-gray-500">PIB found no such scheme · Fake URL flagged</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] text-gray-400 mb-0.5">RISK</p>
                    <p className="font-display font-900 text-red-600 text-2xl">9.4</p>
                    <p className="font-mono text-[9px] text-red-400">HIGH</p>
                  </div>
                </div>

                {/* 3 stat chips */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { val:'11',   label:'Sources',    icon:'books' },
                    { val:'2.1s', label:'Detected in',icon:'timer' },
                    { val:'SCAM', label:'Category',   icon:'warning' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-2.5 text-center">
                      <i className={`ph ph-${s.icon} text-[#2563eb] text-sm`}></i>
                      <p className="font-display font-bold text-[#111318] text-sm mt-0.5">{s.val}</p>
                      <p className="font-mono text-[9px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating LIVE badge */}
            <div className="absolute -top-3 -right-3 bg-[#111318] border border-white/10 rounded-xl px-3.5 py-2 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse"></span>
                <span className="font-mono text-[10px] text-white tracking-widest">LIVE</span>
              </div>
            </div>

            {/* Floating blog badge */}
            <div className="absolute -bottom-3 -left-3 bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 shadow-xl">
              <div className="flex items-center gap-2">
                <i className="ph ph-article text-[#f97316]"></i>
                <span className="text-xs font-semibold text-[#111318]">Blog auto-generated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Features ─── */
function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="w-10 h-1 bg-[#2563eb] rounded mb-4" />
          <span className="eyebrow block mb-3">What makes FRACTA different</span>
          <h2 className="font-display font-900 text-4xl lg:text-5xl text-[#111318] leading-tight mb-5">
            Built for truth at<br/>every scale.
          </h2>
          <p className="text-[#3d4353] text-lg leading-relaxed">
            India-first architecture: multi-language RAG, real-time monitoring, multi-modal verification — powered by Qwen + Gemini 2.0.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map((f,i) => (
            <div key={f.title} className="card group">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 border border-blue-100 group-hover:bg-[#2563eb] group-hover:border-[#2563eb] transition-all">
                  <i className={`ph ph-${f.icon} text-2xl text-[#2563eb] group-hover:text-white transition-colors`}></i>
                </div>
                <div className="flex-1">
                  <span className="pill-blue mb-2.5 inline-flex">{f.label}</span>
                  <h3 className="font-display font-800 text-xl text-[#111318] mb-2">{f.title}</h3>
                  <p className="text-[#3d4353] text-sm leading-relaxed mb-5">{f.desc}</p>
                  <div className="flex items-end gap-2">
                    <span className="font-display font-900 text-4xl text-[#111318]">{f.stat}</span>
                    <span className="text-sm text-gray-400 pb-1">{f.sl}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Stats ─── */
function Stats() {
  const items = [
    {v:'50+',  l:'Claims Verified',i:'check-circle'},
    {v:'98.4%',l:'AI Accuracy',i:'target'},
    {v:'2+',   l:'Indian Languages',i:'translate'},
    {v:'< 3s', l:'Avg Detection',i:'lightning'},
  ]
  return (
    <section className="bg-[#2563eb] py-16">
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {items.map(s => (
            <div key={s.l} className="text-center">
              <i className={`ph ph-${s.i} text-3xl text-blue-200 mb-3 block`}></i>
              <div className="font-display font-900 text-5xl text-white mb-1.5">{s.v}</div>
              <p className="text-blue-200 text-sm font-medium">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works ─── */
function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-[#2563eb] rounded" /></div>
          <span className="eyebrow block mb-3">The pipeline</span>
          <h2 className="font-display font-900 text-4xl lg:text-5xl text-[#111318] leading-tight">
            From claim to verdict<br/>in 4 steps.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => (
            <div key={step.n} className="bg-white border border-[#e2e8f0] rounded-2xl p-7 relative">
              {i < STEPS.length - 1 && <div className="hidden lg:block absolute top-10 -right-2.5 z-10"><i className="ph ph-caret-right text-gray-300 text-lg"></i></div>}
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 bg-[#2563eb] rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,.3)]">
                  <i className={`ph ph-${step.icon} text-white text-xl`}></i>
                </div>
                <span className="font-display font-900 text-3xl text-gray-100">{step.n}</span>
              </div>
              <h3 className="font-display font-800 text-base text-[#111318] mb-2">{step.title}</h3>
              <p className="text-[#3d4353] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Use Cases ─── */
function UseCases() {
  return (
    <section id="use-cases" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-[#2563eb] rounded" /></div>
          <span className="eyebrow block mb-3">Who uses FRACTA</span>
          <h2 className="font-display font-900 text-4xl lg:text-5xl text-[#111318] leading-tight">
            For everyone who believes<br/>facts matter.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {USE_CASES.map(u => (
            <div key={u.role} className="card group">
              <div className="w-12 h-12 rounded-xl bg-[#111318] flex items-center justify-center mb-5 group-hover:bg-[#2563eb] transition-colors">
                <i className={`ph ph-${u.icon} text-xl text-[#2563eb] group-hover:text-white transition-colors`}></i>
              </div>
              <h3 className="font-display font-800 text-lg text-[#111318] mb-2.5">{u.role}</h3>
              <p className="text-[#3d4353] text-sm leading-relaxed">{u.desc}</p>
              <a href="#" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563eb] mt-5 border-b border-[#2563eb] pb-0.5">Learn more </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ─── */
function Pricing() {
  const [yearly, setYearly] = useState(false)
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="text-center max-w-3xl mx-auto mb-6">
          <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-[#2563eb] rounded" /></div>
          <h2 className="font-display font-900 text-4xl lg:text-[3.2rem] text-[#111318] leading-[1.1] mb-4">
            Verify All Your Claims<br/>From One Place.
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-7 mb-8">
          {['Free 15-day trial','Unlimited team members','Cancel anytime'].map(b => (
            <div key={b} className="flex items-center gap-2 text-sm font-semibold text-[#3d4353]">
              <i className="ph ph-check text-[#2563eb] text-base"></i>{b}
            </div>
          ))}
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12 relative">
          {!yearly && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-[#2563eb] italic">
              ↙ get 3 months free
            </span>
          )}
          <span className={`text-sm font-bold ${!yearly?'text-[#111318]':'text-gray-400'}`}>Billed Yearly</span>
          <div className="tog" onClick={() => setYearly(v => !v)}>
            <div className={`tog-knob ${yearly?'on':''}`} />
          </div>
          <span className={`text-sm font-bold ${yearly?'text-[#111318]':'text-gray-400'}`}>Billed Monthly</span>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map(plan => {
            const price = plan.priceM === null ? null : yearly ? plan.priceM : plan.priceY
            return (
              <div key={plan.name} className={`rounded-2xl p-9 border transition-all ${plan.highlight ? 'bg-[#111318] border-[#111318] shadow-[0_20px_60px_rgba(0,0,0,.2)]' : 'bg-white border-[#e2e8f0] hover:shadow-[0_8px_32px_rgba(0,0,0,.08)]'}`}>
                {plan.highlight && <span className="pill-blue mb-4 inline-flex">Most Popular</span>}
                <h3 className={`font-display font-900 text-xl mb-1.5 ${plan.highlight?'text-white':'text-[#111318]'}`}>{plan.name}</h3>
                <p className={`text-sm mb-7 ${plan.highlight?'text-gray-500':'text-gray-400'}`}>{plan.sub}</p>
                <div className="mb-7">
                  {price===null
                    ? <span className={`font-display font-900 text-5xl ${plan.highlight?'text-white':'text-[#111318]'}`}>Custom</span>
                    : price===0
                    ? <span className={`font-display font-900 text-5xl ${plan.highlight?'text-white':'text-[#111318]'}`}>Free</span>
                    : <div className="flex items-end gap-1">
                        <span className={`font-display font-900 text-5xl ${plan.highlight?'text-white':'text-[#111318]'}`}>₹{price.toLocaleString('en-IN')}</span>
                        <span className={`text-sm pb-2 ${plan.highlight?'text-gray-500':'text-gray-400'}`}>/ mo</span>
                      </div>
                  }
                </div>
                <OpenModalBtn className={`block w-full text-center py-3 rounded-xl text-sm font-bold mb-8 border-2 transition-all ${plan.highlight ? 'border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1e40af] hover:border-[#1e40af]' : 'border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb] hover:text-white'}`} skip={plan.name === 'Government'} href="mailto:admin@fracta.in">
                  {plan.cta}
                </OpenModalBtn>
                <ul className="space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <i className={`ph ph-check text-base flex-shrink-0 ${plan.highlight?'text-[#2563eb]':'text-[#111318]'}`}></i>
                      <span className={plan.highlight?'text-gray-400':'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── FAQ ─── */
function FAQ() {
  const [open, setOpen] = useState(null)
  return (
    <section id="faq" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#2563eb]" />
        <div className="absolute top-0 right-0 w-3/4 h-full opacity-60" style={{background:'radial-gradient(ellipse at top right, #f97316 0%, #fb923c 25%, transparent 65%)'}} />
        <div className="absolute bottom-0 left-0 w-1/2 h-2/3 opacity-30" style={{background:'radial-gradient(ellipse at bottom left, #06b6d4 0%, transparent 65%)'}} />
      </div>
      <div className="relative max-w-3xl mx-auto px-5 lg:px-10">
        <div className="text-center mb-12">
          <p className="font-mono text-xs text-white/50 tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="font-display font-900 text-4xl lg:text-5xl text-white leading-tight">Frequently asked<br/>questions.</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-card shadow-sm">
              <button className="w-full flex items-center justify-between px-6 py-5 text-left" onClick={() => setOpen(open===i?null:i)}>
                <span className="font-semibold text-[15px] text-[#111318] pr-6">{faq.q}</span>
                <i className={`ph ph-${open===i?'caret-up':'caret-down'} text-gray-400 text-lg flex-shrink-0`}></i>
              </button>
              {open===i && <div className="px-6 pb-5"><p className="text-[#3d4353] text-sm leading-relaxed">{faq.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Blog ─── */
function BlogSection() {
  const INITIAL = 3
  const BATCH   = 6
  const [posts,    setPosts]    = useState(MOCK_POSTS)
  const [loading,  setLoading]  = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total,    setTotal]    = useState(INITIAL)   // how many to show
  const [hasMore,  setHasMore]  = useState(false)
  const [allPosts, setAllPosts] = useState([])         // full fetched cache

  // Initial load — fetch first 9 to know if "load more" is needed
  useEffect(() => {
    setLoading(true)
    getBlogPosts(9).then(data => {
      if (data?.length) {
        setAllPosts(data)
        setPosts(data.slice(0, INITIAL))
        setHasMore(data.length > INITIAL)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleLoadMore = async () => {
    const nextTotal = total + BATCH
    // If we already have enough cached, just slice
    if (nextTotal <= allPosts.length) {
      setPosts(allPosts.slice(0, nextTotal))
      setTotal(nextTotal)
      setHasMore(allPosts.length > nextTotal)
      return
    }
    // Otherwise fetch more from DB
    setLoadingMore(true)
    try {
      const data = await getBlogPosts(nextTotal + BATCH)
      setAllPosts(data)
      setPosts(data.slice(0, nextTotal))
      setTotal(nextTotal)
      setHasMore(data.length > nextTotal)
    } catch {
      // show what we have
      setPosts(allPosts.slice(0, nextTotal))
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <section id="blog" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        {/* Header — no "View all" link here anymore */}
        <div className="mb-12">
          <div className="w-10 h-1 bg-[#2563eb] rounded mb-4" />
          <span className="eyebrow block mb-2">Latest Blogs</span>
          <h2 className="font-display font-900 text-4xl text-[#111318]">What we've been checking.</h2>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(INITIAL)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#e2e8f0] overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-100" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map(p => <BlogCard key={p.id} post={p} />)}
          </div>
        )}

        {/* Show more / Show less — centered below the grid */}
        {!loading && (hasMore || posts.length > INITIAL) && (
          <div className="flex justify-center mt-12">
            {posts.length <= INITIAL ? (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 border-2 border-[#111318] text-[#111318] text-sm font-bold rounded-xl hover:bg-[#111318] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore
                  ? <><i className="ph ph-circle-notch animate-spin text-base"></i> Loading...</>
                  : <><i className="ph ph-plus text-base"></i> See all blogs</>
                }
              </button>
            ) : (
              <button
                onClick={() => { setPosts(allPosts.slice(0, INITIAL)); setTotal(INITIAL); setHasMore(allPosts.length > INITIAL) }}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 border-2 border-[#e2e8f0] text-gray-500 text-sm font-bold rounded-xl hover:border-[#111318] hover:text-[#111318] transition-all"
              >
                <i className="ph ph-minus text-base"></i> Show less
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section className="bg-[#f8fafc] border-t border-[#e2e8f0] py-24">
      <div className="max-w-4xl mx-auto px-5 lg:px-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#2563eb] rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(37,99,235,.3)]">
            <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5L15 5V13L9 16.5L3 13V5L9 1.5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M6.5 9L8.5 11L12 7" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 className="font-display font-900 text-4xl lg:text-5xl text-[#111318] leading-tight mb-5">
          Ready to fight misinformation<br/>at scale?
        </h2>
        <p className="text-[#3d4353] text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Join newsrooms, journalists, and researchers across India using FRACTA every day.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <OpenModalBtn className="inline-flex items-center gap-2 px-8 py-4 bg-[#2563eb] text-white font-bold rounded-xl hover:bg-[#1e40af] transition-all shadow-[0_4px_20px_rgba(37,99,235,.3)]">
            Start Free No Card Needed 
          </OpenModalBtn>
          <a href="#hero" onClick={e => { e.preventDefault(); document.getElementById('hero')?.scrollIntoView({behavior:'smooth'}) }} className="inline-flex items-center gap-1.5 font-bold text-[#111318] border-b-2 border-[#111318] pb-0.5 hover:text-[#2563eb] hover:border-[#2563eb] transition-colors">
            Book a demo
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── Page ─── */
export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)
  const openModal = useCallback(() => setModalOpen(true), [])

  const location = useLocation()

  // Scroll to correct section after navigation
  useEffect(() => {
    const target = location.state?.scrollTo   // e.g. 'blog' from BlogPost back button
    const hash   = window.location.hash        // e.g. '#features' from nav links

    if (target) {
      const el = document.getElementById(target)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } else if (hash) {
      const el = document.querySelector(hash)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location])

  return (
    <ModalCtx.Provider value={openModal}>
      <LiveTicker />
      <Hero />
      <TrustStrip />
      <AppPreview />
      <Features />
      <Stats />
      <HowItWorks />
      <UseCases />
      <Pricing />
      <FAQ />
      <BlogSection />
      <CTA />
      <GetStartedModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </ModalCtx.Provider>
  )
}