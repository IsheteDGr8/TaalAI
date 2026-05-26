"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// --- Canonical Taal data (matches backend / classify page) ----------------
const TAALS = [
  {
    name: "Teentaal",
    devanagari: "तीनताल",
    beats: 16,
    structure: "4 + 4 + 4 + 4",
    theka: ["Dha", "Dhin", "Dhin", "Dha", "Dha", "Dhin", "Dhin", "Dha", "Dha", "Tin", "Tin", "Ta", "Ta", "Dhin", "Dhin", "Dha"],
    sam: [0],
    khali: [8],
    description: "The absolute king of rhythmic cycles. Highly symmetrical and deeply mathematical, providing a massive 16-beat canvas for complex percussive improvisations.",
    defaultBpm: 120,
  },
  {
    name: "Bhajani",
    devanagari: "भजनी",
    beats: 8,
    structure: "4 + 4",
    theka: ["Dhin", "Na", "Dhin", "Dhin", "Na", "Tin", "Na", "Dhin"],
    sam: [0],
    khali: [4],
    description: "A steady, rolling rhythm widely used in devotional music. Its clean, even split creates a comforting momentum that naturally loops back onto itself.",
    defaultBpm: 100,
  },
  {
    name: "Dadra",
    devanagari: "दादरा",
    beats: 6,
    structure: "3 + 3",
    theka: ["Dha", "Dhin", "Na", "Dha", "Tin", "Na"],
    sam: [0],
    khali: [3],
    description: "A lively, syncopated cycle divided into two equal halves. It swings like a waltz and is the backbone of light semi-classical forms like Thumri.",
    defaultBpm: 90,
  },
];

// --- Taal Circle SVG component --------------------------------------------
function TaalCircle({ taal }) {
  const [bpm, setBpm] = useState(taal.defaultBpm);
  const [playing, setPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const lastTickRef = useRef(0);
  const rafRef = useRef(null);

  // RAF-driven playhead: advance one beat every (60/bpm) seconds while playing.
  useEffect(() => {
    if (!playing) return;
    lastTickRef.current = performance.now();
    setCurrentBeat(0);

    const tick = (now) => {
      const beatDurationMs = (60 / bpm) * 1000;
      if (now - lastTickRef.current >= beatDurationMs) {
        lastTickRef.current = now;
        setCurrentBeat((b) => (b + 1) % taal.beats);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, bpm, taal.beats]);

  // SVG geometry: beats placed clockwise starting at 12 o'clock (top).
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;

  const angleForBeat = (i) => (i / taal.beats) * 2 * Math.PI - Math.PI / 2;
  const posForBeat = (i, r = radius) => ({
    x: cx + r * Math.cos(angleForBeat(i)),
    y: cy + r * Math.sin(angleForBeat(i)),
  });

  // Playhead line: from center to the position of the current beat.
  const playheadEnd = posForBeat(currentBeat, radius * 0.85);

  return (
    <div className="relative bg-[#241712]/60 p-6 rounded-2xl border border-classical-wood/50 hover:border-classical-gold/50 transition-colors group">
      {/* Title row */}
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-2xl font-serif font-bold text-white">{taal.name}</h3>
        <span className="text-xl font-serif text-classical-gold/80">{taal.devanagari}</span>
      </div>
      <div className="flex items-center gap-3 mb-4 text-xs">
        <span className="text-classical-sand/60 font-mono">{taal.beats} matras</span>
        <span className="text-classical-sand/30">·</span>
        <span className="text-classical-gold font-mono">{taal.structure}</span>
      </div>

      {/* The Circle */}
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full">
        <defs>
          <radialGradient id={`bg-${taal.name}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3A2418" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1A0F0A" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        {/* Outer ring fill */}
        <circle cx={cx} cy={cy} r={radius + 30} fill={`url(#bg-${taal.name})`} />
        {/* Ring guide */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#D4AF37" strokeOpacity="0.2" strokeWidth="1" />
        {/* Inner faint circle */}
        <circle cx={cx} cy={cy} r={radius * 0.55} fill="none" stroke="#D4AF37" strokeOpacity="0.1" strokeWidth="1" />

        {/* Vibhag divider lines — radial spokes separating each vibhag block */}
        {taal.structure.split(" + ").reduce((acc, n, idx, arr) => {
          if (idx === 0) return [0];
          const sum = arr.slice(0, idx).reduce((s, x) => s + parseInt(x, 10), 0);
          return [...acc, sum];
        }, []).map((beatIdx) => {
          const p = posForBeat(beatIdx, radius + 22);
          return (
            <line
              key={`spoke-${beatIdx}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#D4AF37"
              strokeOpacity="0.15"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Playhead — rotates around the circle while playing */}
        {playing && (
          <line
            x1={cx}
            y1={cy}
            x2={playheadEnd.x}
            y2={playheadEnd.y}
            stroke="#D4AF37"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(229,169,55,0.8))" }}
          />
        )}

        {/* Beat dots + bols */}
        {taal.theka.map((bol, idx) => {
          const isSam = taal.sam.includes(idx);
          const isKhali = taal.khali.includes(idx);
          const isCurrent = playing && idx === currentBeat;
          const p = posForBeat(idx);

          const fill = isSam ? "#8B3A2B" : isKhali ? "transparent" : "#D4AF37";
          const stroke = isSam ? "#8B3A2B" : isKhali ? "#8B3A2B" : "#D4AF37";

          // Pull the bol label slightly outward from the dot
          const labelP = posForBeat(idx, radius + 18);
          // Pull matra number slightly inward
          const numP = posForBeat(idx, radius - 18);

          return (
            <g key={idx}>
              {/* Beat dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isCurrent ? 11 : 7}
                fill={fill}
                stroke={stroke}
                strokeWidth={isKhali ? 1.5 : 0}
                style={{
                  transition: "r 80ms ease-out",
                  filter: isCurrent ? "drop-shadow(0 0 8px rgba(229,169,55,0.9))" : "none",
                }}
              />
              {/* Bol label */}
              <text
                x={labelP.x}
                y={labelP.y}
                fontSize="13"
                fontFamily="serif"
                fontWeight={isSam ? 700 : 500}
                fill={isSam ? "#FDF4DF" : isKhali ? "#D4AF37" : "#FDF4DF"}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {bol}
              </text>
              {/* Matra number */}
              <text
                x={numP.x}
                y={numP.y}
                fontSize="9"
                fontFamily="monospace"
                fill="#D4AF37"
                opacity="0.5"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {idx + 1}
              </text>
            </g>
          );
        })}

        {/* Center — name + sam indicator */}
        <text
          x={cx}
          y={cy - 8}
          fontSize="12"
          fontFamily="serif"
          fill="#D4AF37"
          textAnchor="middle"
          opacity="0.7"
          letterSpacing="2"
        >
          ताल
        </text>
        <text
          x={cx}
          y={cy + 12}
          fontSize="20"
          fontFamily="serif"
          fontWeight="700"
          fill="#FDF4DF"
          textAnchor="middle"
        >
          {playing ? currentBeat + 1 : "·"}
        </text>
      </svg>

      {/* Controls */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className={`flex-1 py-2.5 rounded-lg font-bold tracking-widest uppercase text-xs transition-colors ${
              playing
                ? "bg-classical-crimson/30 text-red-200 border border-classical-crimson/50 hover:bg-classical-crimson/40"
                : "bg-classical-gold text-classical-dark hover:bg-classical-gold/80"
            }`}
          >
            {playing ? "■ Stop" : "▶ Play Cycle"}
          </button>
          <button
            type="button"
            onClick={() => { setPlaying(false); setCurrentBeat(0); }}
            className="px-3 py-2.5 rounded-lg text-xs uppercase tracking-widest text-classical-sand/70 hover:text-classical-gold border border-classical-wood/50 transition-colors"
          >
            Reset
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-classical-sand/50 mb-1">
            <span>Tempo (BPM)</span>
            <span className="font-mono text-classical-gold">{bpm}</span>
          </div>
          <input
            type="range"
            min="40"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value, 10))}
            className="w-full accent-classical-gold cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-classical-sand/40 font-mono mt-0.5">
            <span>Vilambit</span>
            <span>Madhya</span>
            <span>Drut</span>
          </div>
        </div>
      </div>

      <p className="text-classical-sand/65 text-xs leading-relaxed mt-4 font-light">{taal.description}</p>
    </div>
  );
}

export default function Theory() {
  return (
    <div className="flex-grow flex flex-col items-center p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-classical-wood/30 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl w-full relative z-10">

        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-sm font-bold tracking-[0.4em] text-classical-gold mb-4 uppercase drop-shadow-md">
            The Mathematics of Music
          </h2>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-white mb-6">
            The Anatomy of Taal
          </h1>
          <div className="h-1 w-24 bg-classical-wood mx-auto mb-6 rounded-full"></div>
          <p className="text-lg text-classical-sand/80 max-w-2xl mx-auto font-light leading-relaxed">
            A <i className="font-serif text-classical-gold">Taal</i> is a repeating rhythmic cycle.
            Each beat (<i className="text-classical-gold not-italic">matra</i>) carries a syllable
            (<i className="text-classical-gold not-italic">bol</i>). Press <b className="text-classical-gold">Play</b> on
            any circle to watch the cycle revolve, and drag the tempo slider to change the laya.
          </p>
        </div>

        {/* === INTERACTIVE TAAL CIRCLES === */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TAALS.map((taal) => (
            <TaalCircle key={taal.name} taal={taal} />
          ))}
        </div>

        {/* Legend explaining sam / khali */}
        <div className="mt-10 flex justify-center gap-8 flex-wrap text-sm text-classical-sand/70">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#8B3A2B]"></span>
            <span><b className="text-white">Sam · सम</b> — the downbeat, beat 1 (anchor of the cycle)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-[#8B3A2B]"></span>
            <span><b className="text-white">Khali · खाली</b> — the &quot;empty&quot; beat (wave instead of clap)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#D4AF37]"></span>
            <span><b className="text-white">Matra · मात्रा</b> — every other beat in the cycle</span>
          </span>
        </div>

        <div className="mt-16 text-center">
          <Link href="/classify" className="inline-block px-10 py-4 border border-classical-wood text-classical-gold font-serif font-bold tracking-widest rounded-full hover:bg-classical-wood hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(229,169,55,0.2)]">
            RETURN TO ANALYSIS
          </Link>
        </div>

      </div>
    </div>
  );
}
