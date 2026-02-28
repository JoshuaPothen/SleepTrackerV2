'use client';

import { useEffect, useState } from 'react';

type SleepStage = 'awake' | 'light' | 'deep' | 'absent';

interface Props {
  stage: SleepStage;
  breathingRate?: number | null;
}

export default function SleepStateIllustration({ stage, breathingRate }: Props) {
  const [breathPhase, setBreathPhase] = useState(0);

  // Animate breathing wave based on breathing rate
  useEffect(() => {
    if (!breathingRate || stage === 'absent') return;
    const intervalMs = (60 / breathingRate) * 1000;
    const interval = setInterval(() => {
      setBreathPhase((p) => (p + 1) % 100);
    }, intervalMs / 20);
    return () => clearInterval(interval);
  }, [breathingRate, stage]);

  const opacity = (s: SleepStage) => (stage === s ? 1 : 0);

  // Build breathing wave path (sine approximation)
  const waveY = (x: number) => {
    const amplitude = stage === 'deep' ? 5 : stage === 'light' ? 3 : 1.5;
    return 200 + amplitude * Math.sin((x / 40) * Math.PI * 2 + breathPhase * 0.3);
  };
  const wavePoints = Array.from({ length: 81 }, (_, i) => {
    const x = 60 + i * (280 / 80);
    return `${x},${waveY(i)}`;
  }).join(' ');

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox="0 0 400 260"
        width="100%"
        style={{ maxWidth: 480 }}
        aria-label={`Sleep state: ${stage}`}
        role="img"
      >
        {/* ── Background ────────────────────────────────────── */}
        <rect width="400" height="260" rx="16" fill={stage === 'awake' ? '#fef9c3' : stage === 'absent' ? '#f1f5f9' : '#1e1b4b'} />

        {/* ── Room: window / moon / stars ───────────────────── */}
        {/* Window (awake: sun rays, sleep: moon) */}
        <g opacity={opacity('awake')}>
          <rect x="300" y="20" width="70" height="60" rx="6" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          {/* sun rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <line
              key={i}
              x1={335 + 16 * Math.cos((deg * Math.PI) / 180)}
              y1={50 + 16 * Math.sin((deg * Math.PI) / 180)}
              x2={335 + 24 * Math.cos((deg * Math.PI) / 180)}
              y2={50 + 24 * Math.sin((deg * Math.PI) / 180)}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
          <circle cx="335" cy="50" r="13" fill="#fbbf24" />
        </g>

        {/* Dark room — moon + stars */}
        <g opacity={stage === 'awake' || stage === 'absent' ? 0 : 1} style={{ transition: 'opacity 0.5s' }}>
          <rect x="300" y="20" width="70" height="60" rx="6" fill="#1e3a5f" stroke="#334155" strokeWidth="2" />
          {/* moon crescent */}
          <circle cx="337" cy="50" r="13" fill="#e2e8f0" />
          <circle cx="344" cy="44" r="11" fill="#1e3a5f" />
          {/* stars */}
          {[[315, 30], [355, 25], [375, 45], [360, 65], [325, 68]].map(([sx, sy], i) => (
            <circle key={i} cx={sx} cy={sy} r="1.5" fill="#f8fafc" />
          ))}
        </g>

        {/* Light halo for awake state */}
        <g opacity={opacity('awake')} style={{ transition: 'opacity 0.4s' }}>
          <ellipse cx="200" cy="120" rx="160" ry="80" fill="rgba(254,243,199,0.4)" />
        </g>

        {/* ── Bed frame ─────────────────────────────────────── */}
        {/* Headboard */}
        <rect x="40" y="100" width="18" height="100" rx="6" fill="#78716c" />
        {/* Footboard */}
        <rect x="342" y="120" width="18" height="80" rx="6" fill="#78716c" />
        {/* Bed base */}
        <rect x="40" y="185" width="320" height="25" rx="8" fill="#a8a29e" />
        {/* Mattress */}
        <rect x="58" y="158" width="284" height="34" rx="6" fill="#e7e5e4" />
        {/* Pillow */}
        <ellipse cx="105" cy="163" rx="40" ry="16" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1.5" />
        {/* Duvet / blanket */}
        <rect x="58" y="164" width="284" height="26" rx="6" fill={stage === 'awake' ? '#bfdbfe' : stage === 'light' ? '#c7d2fe' : '#312e81'} style={{ transition: 'fill 0.6s' }} opacity="0.85" />
        {/* Duvet fold highlight */}
        <path d="M58 170 Q200 162 342 170" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />

        {/* ── AWAKE: person sitting up ──────────────────────── */}
        <g opacity={opacity('awake')} style={{ transition: 'opacity 0.4s' }}>
          {/* torso */}
          <rect x="92" y="118" width="26" height="45" rx="10" fill="#fbbf24" />
          {/* head */}
          <circle cx="105" cy="110" r="16" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
          {/* eyes open */}
          <circle cx="100" cy="109" r="3" fill="#1e293b" />
          <circle cx="110" cy="109" r="3" fill="#1e293b" />
          <circle cx="101" cy="108" r="1" fill="white" />
          <circle cx="111" cy="108" r="1" fill="white" />
          {/* smile */}
          <path d="M100 116 Q105 120 110 116" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* arms */}
          <line x1="92" y1="130" x2="72" y2="148" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
          <line x1="118" y1="130" x2="138" y2="148" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
          {/* bedside lamp glow */}
          <ellipse cx="360" cy="140" rx="22" ry="14" fill="rgba(253,224,71,0.4)" />
          <rect x="350" y="132" width="20" height="20" rx="4" fill="#fef08a" stroke="#f59e0b" strokeWidth="1.5" />
          <rect x="357" y="148" width="6" height="16" rx="2" fill="#78716c" />
        </g>

        {/* ── LIGHT: person lying, eyes half open ───────────── */}
        <g opacity={opacity('light')} style={{ transition: 'opacity 0.4s' }}>
          {/* head on pillow */}
          <circle cx="105" cy="157" r="15" fill="#fde68a" stroke="#d6d3d1" strokeWidth="1" />
          {/* half-closed eyes */}
          <path d="M99 155 Q102 153 105 155" stroke="#1e293b" strokeWidth="2" fill="none" />
          <path d="M105 155 Q108 153 111 155" stroke="#1e293b" strokeWidth="2" fill="none" />
          {/* body under duvet */}
          <rect x="115" y="161" width="180" height="16" rx="8" fill="#e2e8f0" opacity="0.5" />
          {/* dim lamp */}
          <ellipse cx="360" cy="140" rx="14" ry="9" fill="rgba(253,224,71,0.15)" />
          <rect x="350" y="132" width="20" height="20" rx="4" fill="#fef9c3" stroke="#d6d3d1" strokeWidth="1.5" />
          <rect x="357" y="148" width="6" height="16" rx="2" fill="#78716c" />
        </g>

        {/* ── DEEP: person lying, eyes closed, zzz ─────────── */}
        <g opacity={opacity('deep')} style={{ transition: 'opacity 0.4s' }}>
          {/* head on pillow */}
          <circle cx="105" cy="157" r="15" fill="#c7d2fe" stroke="#4338ca" strokeWidth="1" />
          {/* closed eyes */}
          <path d="M99 157 Q102 154 105 157" stroke="#312e81" strokeWidth="2" fill="none" />
          <path d="M105 157 Q108 154 111 157" stroke="#312e81" strokeWidth="2" fill="none" />
          {/* body under duvet */}
          <rect x="115" y="161" width="180" height="16" rx="8" fill="#4338ca" opacity="0.3" />
          {/* Zzz particles */}
          <ZzzParticles />
        </g>

        {/* ── ABSENT: empty bed ─────────────────────────────── */}
        <g opacity={opacity('absent')} style={{ transition: 'opacity 0.4s' }}>
          {/* indent where person would be */}
          <ellipse cx="200" cy="168" rx="130" ry="8" fill="rgba(0,0,0,0.04)" />
          {/* question mark */}
          <text x="195" y="145" fontSize="28" fill="#94a3b8" textAnchor="middle" fontFamily="serif">?</text>
          <text x="195" y="135" fontSize="11" fill="#94a3b8" textAnchor="middle" fontFamily="sans-serif">No presence detected</text>
        </g>

        {/* ── Breathing wave (shown when presence detected) ─── */}
        {stage !== 'absent' && (
          <polyline
            points={wavePoints}
            fill="none"
            stroke={stage === 'deep' ? '#818cf8' : stage === 'light' ? '#93c5fd' : '#fbbf24'}
            strokeWidth="2"
            strokeOpacity="0.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* ── Stage label ───────────────────────────────────── */}
        <text
          x="200"
          y="245"
          textAnchor="middle"
          fontSize="13"
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
          fill={stage === 'awake' ? '#92400e' : stage === 'absent' ? '#64748b' : '#a5b4fc'}
          style={{ transition: 'fill 0.4s' }}
        >
          {stage === 'awake' ? 'Awake'
            : stage === 'light' ? 'Light Sleep'
            : stage === 'deep' ? 'Deep Sleep'
            : 'No Presence'}
        </text>
      </svg>
    </div>
  );
}

// Animated Zzz particles rendered as SVG text with CSS keyframe animation
function ZzzParticles() {
  return (
    <>
      <style>{`
        @keyframes floatZ1 { 0%{opacity:0;transform:translate(0,0)} 20%{opacity:1} 100%{opacity:0;transform:translate(-12px,-40px)} }
        @keyframes floatZ2 { 0%{opacity:0;transform:translate(0,0)} 20%{opacity:1} 100%{opacity:0;transform:translate(-8px,-55px)} }
        @keyframes floatZ3 { 0%{opacity:0;transform:translate(0,0)} 20%{opacity:1} 100%{opacity:0;transform:translate(-4px,-70px)} }
        .z1{animation:floatZ1 3s ease-in-out infinite;}
        .z2{animation:floatZ2 3s ease-in-out 1s infinite;}
        .z3{animation:floatZ3 3s ease-in-out 2s infinite;}
      `}</style>
      <text className="z1" x="130" y="140" fontSize="16" fill="#818cf8" fontWeight="bold" fontFamily="system-ui">z</text>
      <text className="z2" x="148" y="125" fontSize="20" fill="#a5b4fc" fontWeight="bold" fontFamily="system-ui">Z</text>
      <text className="z3" x="170" y="108" fontSize="26" fill="#c7d2fe" fontWeight="bold" fontFamily="system-ui">Z</text>
    </>
  );
}
