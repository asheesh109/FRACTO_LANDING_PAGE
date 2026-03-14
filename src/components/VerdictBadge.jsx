import React from 'react'

const CFG = {
  FALSE:      { bg:'bg-red-50',    text:'text-red-700',    border:'border-red-200',    icon:'x-circle',     label:'False' },
  MISLEADING: { bg:'bg-amber-50',  text:'text-amber-700',  border:'border-amber-200',  icon:'warning',      label:'Misleading' },
  UNVERIFIED: { bg:'bg-slate-50',  text:'text-slate-600',  border:'border-slate-200',  icon:'question',     label:'Unverified' },
  TRUE:       { bg:'bg-green-50',  text:'text-green-700',  border:'border-green-200',  icon:'check-circle', label:'True' },
}

const SZ = {
  sm: 'text-[9px] px-1.5 py-0.5 gap-0.5',
  md: 'text-xs  px-2.5 py-1  gap-1',
  lg: 'text-sm  px-3.5 py-1.5 gap-1.5',
}

export default function VerdictBadge({ verdict, size = 'md' }) {
  const c = CFG[verdict?.toUpperCase()] || CFG.UNVERIFIED
  return (
    <span className={`inline-flex items-center font-bold rounded-full border ${c.bg} ${c.text} ${c.border} ${SZ[size]}`}>
      <i className={`ph ph-${c.icon}`}></i>
      {size !== 'sm' && <span>{c.label}</span>}
    </span>
  )
}