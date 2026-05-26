"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/utils/supabase";

const MAX_RECORDING_SECONDS = 90;
const MIN_CROP_SECONDS = 20;
const MAX_CROP_SECONDS = 600;

// --- iPhone-style dual-thumb trim slider -----------------------------------
function TrimSlider({ duration, minSpan, startSec, endSec, onChange, formatTime }) {
  const trackRef = useRef(null);
  const dragRef = useRef(null); // { which: 'start'|'end'|'range', anchorPx, anchorStart, anchorEnd }
  const [activeThumb, setActiveThumb] = useState(null);

  const pctStart = duration > 0 ? (startSec / duration) * 100 : 0;
  const pctEnd = duration > 0 ? (endSec / duration) * 100 : 100;
  const selectedSpan = Math.max(0, endSec - startSec);

  const pxToSec = (clientX) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const beginDrag = (which) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget && e.currentTarget.setPointerCapture && e.pointerId !== undefined) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    }
    dragRef.current = {
      which,
      anchorPx: e.clientX,
      anchorStart: startSec,
      anchorEnd: endSec,
    };
    setActiveThumb(which);

    const onMove = (ev) => {
      if (!dragRef.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const deltaSec = ((ev.clientX - dragRef.current.anchorPx) / rect.width) * duration;
      let ns = dragRef.current.anchorStart;
      let ne = dragRef.current.anchorEnd;

      if (dragRef.current.which === "start") {
        ns = Math.min(Math.max(0, dragRef.current.anchorStart + deltaSec), ne - minSpan);
      } else if (dragRef.current.which === "end") {
        ne = Math.max(Math.min(duration, dragRef.current.anchorEnd + deltaSec), ns + minSpan);
      } else {
        // dragging the highlighted region — preserve span, clamp to ends
        const span = dragRef.current.anchorEnd - dragRef.current.anchorStart;
        let candidateStart = dragRef.current.anchorStart + deltaSec;
        candidateStart = Math.max(0, Math.min(candidateStart, duration - span));
        ns = candidateStart;
        ne = candidateStart + span;
      }
      onChange(ns, ne);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      dragRef.current = null;
      setActiveThumb(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  // Click on the dimmed sides snaps the nearest handle to that point.
  const onTrackClick = (e) => {
    if (activeThumb) return;
    const sec = pxToSec(e.clientX);
    if (sec < startSec) {
      onChange(Math.min(sec, endSec - minSpan), endSec);
    } else if (sec > endSec) {
      onChange(startSec, Math.max(sec, startSec + minSpan));
    }
  };

  return (
    <div className="w-full select-none touch-none">
      {/* Live readout */}
      <div className="flex items-center justify-between mb-2 font-mono text-xs">
        <span className="text-classical-gold font-bold tabular-nums">{formatTime(Math.round(startSec))}</span>
        <span className="text-classical-sand/70">{formatTime(Math.round(selectedSpan))} selected</span>
        <span className="text-classical-gold font-bold tabular-nums">{formatTime(Math.round(endSec))}</span>
      </div>

      {/* The track */}
      <div
        ref={trackRef}
        onPointerDown={onTrackClick}
        className="relative h-14 bg-classical-dark/70 border-2 border-classical-wood/70 rounded-lg cursor-pointer overflow-visible"
      >
        {/* Dimmed left side */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-stone-900/60 rounded-l-md pointer-events-none"
          style={{ width: `${pctStart}%` }}
        ></div>
        {/* Dimmed right side */}
        <div
          className="absolute top-0 bottom-0 right-0 bg-stone-900/60 rounded-r-md pointer-events-none"
          style={{ width: `${100 - pctEnd}%` }}
        ></div>

        {/* Highlighted selected region — draggable as a whole */}
        <div
          onPointerDown={beginDrag("range")}
          className={`absolute top-0 bottom-0 bg-classical-gold/25 border-y-2 ${activeThumb === "range" ? "border-classical-gold" : "border-classical-gold/60"} cursor-grab active:cursor-grabbing transition-colors`}
          style={{ left: `${pctStart}%`, right: `${100 - pctEnd}%` }}
        >
          {/* Subtle inner stripe pattern for "selected" feel */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(229,169,55,0.08)_6px,rgba(229,169,55,0.08)_12px)] pointer-events-none"></div>
        </div>

        {/* Left handle */}
        <div
          onPointerDown={beginDrag("start")}
          className="absolute top-0 bottom-0 flex items-center justify-center cursor-ew-resize"
          style={{ left: `${pctStart}%`, transform: "translateX(-50%)", width: 22, touchAction: "none" }}
        >
          <div className={`w-2 h-12 bg-classical-gold rounded-sm shadow-[0_0_12px_rgba(229,169,55,0.6)] border border-classical-dark/40 ${activeThumb === "start" ? "scale-110" : ""} transition-transform`}></div>
        </div>

        {/* Right handle */}
        <div
          onPointerDown={beginDrag("end")}
          className="absolute top-0 bottom-0 flex items-center justify-center cursor-ew-resize"
          style={{ left: `${pctEnd}%`, transform: "translateX(-50%)", width: 22, touchAction: "none" }}
        >
          <div className={`w-2 h-12 bg-classical-gold rounded-sm shadow-[0_0_12px_rgba(229,169,55,0.6)] border border-classical-dark/40 ${activeThumb === "end" ? "scale-110" : ""} transition-transform`}></div>
        </div>
      </div>

      {/* Track scale labels */}
      <div className="flex justify-between text-[10px] text-classical-sand/40 font-mono mt-1">
        <span>0:00</span>
        <span>{formatTime(Math.round(duration))}</span>
      </div>
    </div>
  );
}

export default function Classify() {
  const [inputType, setInputType] = useState("file"); // 'file' | 'youtube' | 'mic'
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState("idle"); // 'idle' | 'asking' | 'submitted'
  const [hoveredChunk, setHoveredChunk] = useState(null);

  // --- Cropper state (slider-based) ---
  const [cropEnabled, setCropEnabled] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);       // total duration in seconds
  const [cropStartSec, setCropStartSec] = useState(0);         // selected start
  const [cropEndSec, setCropEndSec] = useState(0);             // selected end
  const [probing, setProbing] = useState(false);               // YouTube duration probe in flight
  const [probeError, setProbeError] = useState(null);

  // --- Microphone state ---
  const [recordingState, setRecordingState] = useState("idle"); // 'idle' | 'recording' | 'recorded'
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState(null);

  // --- Refs ---
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const resultCardRef = useRef(null);
  const downloadingImageRef = useRef(false);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Initialise crop range to full duration whenever audioDuration changes.
  useEffect(() => {
    if (audioDuration > 0) {
      setCropStartSec(0);
      setCropEndSec(audioDuration);
    } else {
      setCropStartSec(0);
      setCropEndSec(0);
    }
  }, [audioDuration]);

  // --- Duration detection: FILE / MIC mode (HTML5 Audio metadata) ---
  useEffect(() => {
    if (!file || inputType === "youtube") {
      if (inputType !== "youtube") setAudioDuration(0);
      return;
    }
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = url;
    const onMeta = () => {
      const d = audio.duration;
      if (isFinite(d) && d > 0) setAudioDuration(d);
    };
    audio.addEventListener("loadedmetadata", onMeta);
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      URL.revokeObjectURL(url);
    };
  }, [file, inputType]);

  // --- Duration detection: YOUTUBE mode (debounced probe call to backend) ---
  useEffect(() => {
    if (inputType !== "youtube") return;
    const url = youtubeUrl.trim();
    setProbeError(null);
    if (!url) {
      setAudioDuration(0);
      return;
    }
    let cancelled = false;
    setProbing(true);
    const handle = setTimeout(async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiBase}/probe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio_url: url }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.detail || "Probe failed");
        setAudioDuration(data.duration);
      } catch (err) {
        if (!cancelled) {
          setAudioDuration(0);
          setProbeError(err.message);
        }
      } finally {
        if (!cancelled) setProbing(false);
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [youtubeUrl, inputType]);

  // Cleanup any active mic stream / timers on unmount.
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Microphone recording ---
  const startRecording = async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const mime = mr.mimeType || "audio/webm";
        const ext = mime.includes("webm") ? "webm" : (mime.includes("ogg") ? "ogg" : "wav");
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        const synthFile = new File([blob], `recording_${Date.now()}.${ext}`, { type: mime });
        setFile(synthFile);

        if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
        setRecordedPreviewUrl(URL.createObjectURL(blob));
        setRecordingState("recorded");

        // Release the microphone.
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };

      mr.start();
      setRecordingState("recording");
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => {
          const next = d + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("[Taal AI] Mic access failed:", err);
      setError("Microphone access was denied or unavailable. Please allow mic access in your browser settings.");
      setRecordingState("idle");
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const resetRecording = () => {
    if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
    setRecordedPreviewUrl(null);
    setRecordingState("idle");
    setRecordingDuration(0);
    setFile(null);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError(null);
    }
  };

  const switchInputType = (next) => {
    setInputType(next);
    setError(null);
    setResult(null);
    setCropEnabled(false);
    setAudioDuration(0);
    setProbing(false);
    setProbeError(null);
    if (next !== "mic" && recordingState !== "idle") {
      stopRecording();
      resetRecording();
    }
    if (next !== "file" && next !== "mic") {
      setFile(null);
    }
  };

  // --- PNG download of the result card ---
  const downloadAsImage = async () => {
    if (!resultCardRef.current || downloadingImageRef.current) return;
    downloadingImageRef.current = true;
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(resultCardRef.current, {
        backgroundColor: "#FDF4DF",
        scale: 2,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `taal-ai-${(result?.prediction || "analysis").toLowerCase()}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    } catch (err) {
      console.error("[Taal AI] Image export failed:", err);
      setError("Couldn't export image: " + err.message);
    } finally {
      downloadingImageRef.current = false;
    }
  };

  const handleAnalyze = async () => {
    if ((inputType === "file" || inputType === "mic") && !file) {
      setError(inputType === "mic" ? "Please record some audio first." : "Please select an audio file first.");
      return;
    }
    if (inputType === "youtube" && !youtubeUrl.trim()) {
      setError("Please enter a valid YouTube URL.");
      return;
    }

    // --- Validate cropper inputs if enabled (slider values) ---
    let startSec = null;
    let endSec = null;
    if (cropEnabled) {
      if (audioDuration <= 0) {
        setError("Audio duration is not yet known — wait for it to load before trimming.");
        return;
      }
      startSec = Math.round(cropStartSec);
      endSec = Math.round(cropEndSec);
      if (endSec - startSec < MIN_CROP_SECONDS) {
        setError(`Selected section must be at least ${MIN_CROP_SECONDS} seconds long.`);
        return;
      }
      if (endSec - startSec > MAX_CROP_SECONDS) {
        setError(`Selected section cannot exceed ${MAX_CROP_SECONDS / 60} minutes.`);
        return;
      }
      // If the user "trimmed" to the full audio, skip sending the range entirely.
      if (startSec === 0 && Math.abs(endSec - audioDuration) < 1) {
        startSec = null;
        endSec = null;
      }
    }

    setFeedbackStatus("idle");
    setHoveredChunk(null);
    setLoading(true);
    setError(null);
    setResult(null);

    let fileNameForCleanup = null;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      if (!apiBase) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured. Check frontend/.env.local and restart the dev server.");
      }

      let targetUrl = "";

      if (inputType === "file" || inputType === "mic") {
        if (file.size > 50 * 1024 * 1024) {
          throw new Error("File is larger than 50 MB, which exceeds the Supabase upload limit.");
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        fileNameForCleanup = fileName;

        console.log("[Taal AI] Uploading file to Supabase:", fileName, file.type, file.size);
        const { error: uploadError } = await supabase.storage
          .from('audio-uploads')
          .upload(fileName, file, { contentType: file.type || 'audio/mpeg', upsert: false });
        if (uploadError) throw new Error("Supabase Error: " + uploadError.message);

        const { data: publicUrlData } = supabase.storage.from('audio-uploads').getPublicUrl(fileName);
        targetUrl = publicUrlData.publicUrl;
        console.log("[Taal AI] Public URL:", targetUrl);
      } else {
        targetUrl = youtubeUrl.trim();
      }

      const payload = { audio_url: targetUrl };
      if (startSec !== null && endSec !== null) {
        payload.start_time = startSec;
        payload.end_time = endSec;
      }

      console.log("[Taal AI] Calling backend:", `${apiBase}/predict`, payload);
      const response = await fetch(`${apiBase}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const predictionData = await response.json();
      if (!response.ok || predictionData.error) {
        throw new Error(predictionData.error || predictionData.detail || "Failed to analyze audio.");
      }

      setResult(predictionData);

    } catch (err) {
      console.error("[Taal AI] Analyze failed:", err);
      setError(err.message);
    } finally {
      // 3. Always clean up Supabase storage if a file was uploaded
      if (fileNameForCleanup) {
        await supabase.storage.from('audio-uploads').remove([fileNameForCleanup]);
      }
      setLoading(false);
    }
  };

  const submitFeedback = async (isCorrect, actualTaal = null) => {
    try {
      let source;
      if (inputType === "youtube") source = youtubeUrl;
      else if (inputType === "mic") source = `MIC_RECORDING (${recordingDuration}s)`;
      else source = file?.name;
      const { error: insertError } = await supabase
        .from("user_corrections")
        .insert([{
          audio_source: source,
          ai_prediction: result.prediction,
          user_correction: isCorrect ? "CORRECT" : actualTaal,
        }]);

      if (insertError) throw insertError;
      setFeedbackStatus("submitted");
    } catch (err) {
      console.error("Failed to save feedback:", err);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 relative z-10">
      
      {/* Massive Devanagari Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-serif text-classical-wood/20 pointer-events-none select-none leading-none z-0">
        ताल
      </div>

      {/* --- THE JHAROKHA ARCHWAY CONTAINER --- */}
      <div className="max-w-2xl w-full relative z-10 pt-16">

        {/* === KALASH FINIAL with mango leaves — traditional Indian pinnacle ===
            Stacked dome (kalash water-pot) flanked by two stylized mango leaves. */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 z-30 pointer-events-none">
          <svg width="48" height="56" viewBox="0 0 48 56" className="drop-shadow-[0_2px_6px_rgba(229,169,55,0.4)]">
            {/* Left mango leaf */}
            <path d="M 24,40 Q 8,38 6,28 Q 14,30 24,40 Z" fill="#D4AF37" opacity="0.85" />
            {/* Right mango leaf */}
            <path d="M 24,40 Q 40,38 42,28 Q 34,30 24,40 Z" fill="#D4AF37" opacity="0.85" />
            {/* Central stem rising from the leaves */}
            <line x1="24" y1="40" x2="24" y2="18" stroke="#D4AF37" strokeWidth="2" />
            {/* Top dome of the kalash */}
            <circle cx="24" cy="16" r="4" fill="#D4AF37" />
            {/* Tiny crowning bead */}
            <circle cx="24" cy="8" r="2" fill="#D4AF37" />
            <line x1="24" y1="10" x2="24" y2="12" stroke="#D4AF37" strokeWidth="1.5" />
          </svg>
        </div>

        {/* The Jharokha Frame — a SINGLE elegant Mughal ogee arch (clean, less busy
            than the multi-foil) drawn as a stretchable SVG path, plus a rectangular
            body that grows with content. */}
        <div className="absolute inset-0 pointer-events-none flex flex-col">
          {/* OGEE ARCH TOP (fixed height; non-scaling-stroke keeps the gold line crisp) */}
          <div className="relative h-[170px] flex-shrink-0">
            <svg
              viewBox="0 -6 400 176"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full overflow-visible"
              style={{ filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.5))" }}
            >
              <defs>
                {/* Subtle radial highlight inside the dome so the arch has depth */}
                <radialGradient id="domeGlow" cx="50%" cy="100%" r="80%">
                  <stop offset="0%" stopColor="#3A2418" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#1A0F0A" stopOpacity="0.95" />
                </radialGradient>
              </defs>

              {/* Outer body — a clean tall ogee arch (subtle pointed apex like Taj Mahal) */}
              <path
                d="
                  M 0,176
                  L 0,90
                  C 0,45 70,8 198,2
                  L 200,-4
                  L 202,2
                  C 330,8 400,45 400,90
                  L 400,176
                  Z
                "
                fill="url(#domeGlow)"
                stroke="#D4AF37"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
              {/* Inner gold filigree (parallel offset) */}
              <path
                d="
                  M 10,176
                  L 10,92
                  C 10,55 78,20 198,14
                  L 200,9
                  L 202,14
                  C 322,20 390,55 390,92
                  L 390,176
                "
                fill="none"
                stroke="#D4AF37"
                strokeOpacity="0.32"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />

              {/* === LOTUS ROSETTE inside the keystone area === */}
              <g transform="translate(200, 60)" opacity="0.7">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                  <ellipse
                    key={angle}
                    cx="0"
                    cy="-8"
                    rx="3"
                    ry="8"
                    fill="#D4AF37"
                    opacity="0.5"
                    transform={`rotate(${angle})`}
                  />
                ))}
                <circle cx="0" cy="0" r="3" fill="#D4AF37" />
              </g>
            </svg>
          </div>

          {/* RECTANGULAR BODY with subtle jali (lattice) pattern background */}
          <div
            className="flex-1 -mt-px bg-[#241712]/90 backdrop-blur-2xl border-x-[2.5px] border-b-[2.5px] border-classical-gold rounded-b-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative"
            style={{
              // Diamond jali pattern — extremely subtle, evokes carved haveli screens
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(229,169,55,0.035) 0 1px, transparent 1px 18px), repeating-linear-gradient(-45deg, rgba(229,169,55,0.035) 0 1px, transparent 1px 18px)",
            }}
          >
            {/* Inner filigree line mirroring the body sides */}
            <div className="absolute inset-2 border border-classical-gold/25 rounded-b-xl pointer-events-none"></div>

            {/* === SUN-BURST CHHAJJA brackets where the arch meets the body === */}
            <div className="absolute -top-4 left-3 pointer-events-none">
              <svg width="32" height="20" viewBox="0 0 32 20">
                <path d="M 16,18 L 4,4 M 16,18 L 10,2 M 16,18 L 16,0 M 16,18 L 22,2 M 16,18 L 28,4" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="16" cy="18" r="2.5" fill="#D4AF37" />
              </svg>
            </div>
            <div className="absolute -top-4 right-3 pointer-events-none">
              <svg width="32" height="20" viewBox="0 0 32 20">
                <path d="M 16,18 L 4,4 M 16,18 L 10,2 M 16,18 L 16,0 M 16,18 L 22,2 M 16,18 L 28,4" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="16" cy="18" r="2.5" fill="#D4AF37" />
              </svg>
            </div>

            {/* === Lotus rosettes at the bottom corners === */}
            <div className="absolute bottom-2 left-2 pointer-events-none opacity-50">
              <svg width="20" height="20" viewBox="-12 -12 24 24">
                {[0, 60, 120, 180, 240, 300].map((angle) => (
                  <ellipse key={angle} cx="0" cy="-5" rx="2" ry="5" fill="#D4AF37" transform={`rotate(${angle})`} />
                ))}
                <circle cx="0" cy="0" r="2" fill="#D4AF37" />
              </svg>
            </div>
            <div className="absolute bottom-2 right-2 pointer-events-none opacity-50">
              <svg width="20" height="20" viewBox="-12 -12 24 24">
                {[0, 60, 120, 180, 240, 300].map((angle) => (
                  <ellipse key={angle} cx="0" cy="-5" rx="2" ry="5" fill="#D4AF37" transform={`rotate(${angle})`} />
                ))}
                <circle cx="0" cy="0" r="2" fill="#D4AF37" />
              </svg>
            </div>
          </div>
        </div>

        <div className="relative z-20 p-8 md:p-14 pt-24">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Analysis Engine</h2>
            <div className="h-1 w-16 bg-classical-gold mx-auto rounded-full mb-4 opacity-50"></div>
          </div>

          {/* Input Toggle */}
          <div className="flex flex-wrap justify-center mb-8 bg-classical-wood/20 p-1 rounded-full w-fit mx-auto border border-classical-wood/50">
            <button
              onClick={() => switchInputType('file')}
              disabled={loading}
              className={`px-5 py-2 rounded-full text-sm font-bold tracking-widest transition-all ${inputType === 'file' ? 'bg-classical-gold text-classical-dark shadow-md' : 'text-classical-sand/70 hover:text-white'}`}
            >
              FILE
            </button>
            <button
              onClick={() => switchInputType('youtube')}
              disabled={loading}
              className={`px-5 py-2 rounded-full text-sm font-bold tracking-widest transition-all ${inputType === 'youtube' ? 'bg-classical-gold text-classical-dark shadow-md' : 'text-classical-sand/70 hover:text-white'}`}
            >
              YOUTUBE
            </button>
            <button
              onClick={() => switchInputType('mic')}
              disabled={loading}
              className={`px-5 py-2 rounded-full text-sm font-bold tracking-widest transition-all ${inputType === 'mic' ? 'bg-classical-gold text-classical-dark shadow-md' : 'text-classical-sand/70 hover:text-white'}`}
            >
              LIVE MIC
            </button>
          </div>

          {/* Interactive Dropzone / Input Area */}
          {inputType === "file" && (
            <div
              onClick={() => !loading && fileInputRef.current.click()}
              className={`relative z-10 overflow-hidden border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 group ${
                loading ? 'border-classical-wood/30 bg-transparent cursor-default' :
                file ? 'border-classical-gold bg-classical-gold/5 cursor-pointer' :
                'border-classical-wood hover:border-classical-gold hover:bg-classical-wood/20 cursor-pointer'
              }`}
            >
              <input type="file" accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac" onChange={handleFileChange} ref={fileInputRef} className="hidden" disabled={loading} />
              <div className="relative z-10 flex flex-col items-center">
                <span className={`text-4xl mb-4 transition-transform duration-300 ${file ? 'scale-110' : 'group-hover:-translate-y-2'}`}>
                  {file ? '🎵' : '🎙️'}
                </span>
                <div className="font-serif text-lg text-white">
                  {file ? file.name : "Tap to browse local audio files"}
                </div>
              </div>
            </div>
          )}

          {inputType === "youtube" && (
            <div className={`relative z-10 overflow-hidden border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 ${loading ? 'border-classical-wood/30 bg-transparent' : 'border-classical-wood bg-classical-wood/10 focus-within:border-classical-gold focus-within:bg-classical-wood/20'}`}>
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-6">📺</span>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste YouTube link (max 10 mins)..."
                  className="w-full bg-transparent border-b border-classical-wood/70 pb-2 text-center text-white placeholder-classical-sand/40 outline-none focus:border-classical-gold transition-colors font-serif text-lg"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {inputType === "mic" && (
            <div className={`relative z-10 border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-500 ${
              recordingState === "recording" ? 'border-red-500/70 bg-red-500/5' :
              recordingState === "recorded" ? 'border-classical-gold bg-classical-gold/5' :
              'border-classical-wood bg-classical-wood/10'
            }`}>
              {recordingState === "idle" && (
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={loading}
                    className="group relative w-24 h-24 rounded-full bg-classical-wood border-2 border-classical-gold/60 flex items-center justify-center hover:bg-classical-gold/30 transition-all shadow-[0_0_20px_rgba(229,169,55,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Start recording"
                  >
                    <span className="w-10 h-10 rounded-full bg-red-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.6)]"></span>
                  </button>
                  <p className="mt-5 font-serif text-lg text-white">Tap to record</p>
                  <p className="text-classical-sand/60 text-xs tracking-widest uppercase mt-1">Up to {MAX_RECORDING_SECONDS}s · uses your microphone</p>
                </div>
              )}

              {recordingState === "recording" && (
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute w-full h-full rounded-full border-2 border-red-500/40 animate-ping"></div>
                    <div className="absolute w-5/6 h-5/6 rounded-full border border-red-500/30 animate-pulse"></div>
                    <span className="relative w-10 h-10 rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]"></span>
                  </div>
                  <p className="mt-5 font-mono text-3xl text-white tabular-nums">{formatTime(recordingDuration)}</p>
                  <p className="text-red-300/80 text-xs tracking-widest uppercase mt-1">Recording…</p>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="mt-5 px-6 py-2 rounded-full bg-red-500/20 border border-red-500/60 text-red-200 text-sm font-bold tracking-widest hover:bg-red-500/40 transition-colors"
                  >
                    ◼ STOP
                  </button>
                </div>
              )}

              {recordingState === "recorded" && (
                <div className="flex flex-col items-center w-full">
                  <span className="text-4xl mb-3">🎵</span>
                  <p className="font-serif text-lg text-white mb-1">Recording captured · {formatTime(recordingDuration)}</p>
                  {recordedPreviewUrl && (
                    <audio controls src={recordedPreviewUrl} className="w-full max-w-md mt-3"></audio>
                  )}
                  <button
                    type="button"
                    onClick={resetRecording}
                    disabled={loading}
                    className="mt-4 text-xs text-classical-sand/70 hover:text-classical-gold uppercase tracking-widest underline underline-offset-4 disabled:opacity-40"
                  >
                    Re-record
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- AUDIO SEGMENT CROPPER (slider) --- */}
          {((inputType === "file" && file) || (inputType === "youtube" && youtubeUrl.trim())) && !loading && (
            <div className="mt-4 relative z-10 bg-classical-wood/15 border border-classical-wood/40 rounded-xl p-4">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cropEnabled}
                  onChange={(e) => setCropEnabled(e.target.checked)}
                  disabled={inputType === "youtube" && (probing || audioDuration <= 0)}
                  className="w-4 h-4 accent-classical-gold cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="ml-3 text-sm font-bold tracking-widest uppercase text-classical-gold">
                  Trim section
                </span>
                <span className="ml-2 text-[10px] text-classical-sand/50 italic">(faster &middot; more accurate)</span>
              </label>

              {/* YouTube probe states */}
              {inputType === "youtube" && probing && (
                <p className="mt-3 text-[11px] text-classical-sand/60 italic">Fetching video duration…</p>
              )}
              {inputType === "youtube" && probeError && !probing && (
                <p className="mt-3 text-[11px] text-red-300/80">Couldn&apos;t read video duration: {probeError}</p>
              )}

              {cropEnabled && audioDuration > 0 && (
                <div className="mt-4 animate-fade-in">
                  <TrimSlider
                    duration={audioDuration}
                    minSpan={MIN_CROP_SECONDS}
                    startSec={cropStartSec}
                    endSec={cropEndSec}
                    onChange={(s, e) => { setCropStartSec(s); setCropEndSec(e); }}
                    formatTime={formatTime}
                  />
                  <p className="text-[10px] text-classical-sand/50 italic mt-3 text-center">
                    Drag the gold handles &middot; min {MIN_CROP_SECONDS}s &middot; for YouTube only this slice is downloaded.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Area / Tabla Visualizer */}
          <div className="mt-8 relative z-10 min-h-[80px] flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                  <div className="absolute w-full h-full border border-classical-gold rounded-full animate-tabla-ripple" style={{ animationDelay: '0s' }}></div>
                  <div className="absolute w-full h-full border border-classical-gold rounded-full animate-tabla-ripple" style={{ animationDelay: '0.6s' }}></div>
                  <div className="absolute w-full h-full border border-classical-gold rounded-full animate-tabla-ripple" style={{ animationDelay: '1.2s' }}></div>
                  <div className="w-4 h-4 bg-classical-dark rounded-full z-10 border border-classical-gold/50 shadow-[0_0_10px_rgba(229,169,55,0.5)]"></div>
                </div>
                <span className="text-classical-gold tracking-[0.4em] font-bold text-xs">
                  {inputType === 'youtube' ? (cropEnabled ? 'DOWNLOADING SEGMENT...' : 'EXTRACTING AUDIO...') : 'LISTENING...'}
                </span>
              </div>
            ) : (() => {
              const isDisabled =
                (inputType === 'file' && !file) ||
                (inputType === 'youtube' && !youtubeUrl.trim()) ||
                (inputType === 'mic' && (recordingState !== 'recorded' || !file));
              return (
                <button
                  onClick={handleAnalyze}
                  disabled={isDisabled}
                  className={`w-full py-5 rounded-xl font-bold tracking-[0.2em] transition-all duration-500 ${
                    isDisabled
                      ? 'bg-classical-dark text-classical-sand/30 border border-classical-wood cursor-not-allowed'
                      : 'bg-classical-wood text-classical-gold hover:bg-classical-gold hover:text-classical-dark hover:shadow-[0_0_30px_rgba(229,169,55,0.4)] border border-classical-gold/50'
                  }`}
                >
                  COMMENCE CLASSIFICATION
                </button>
              );
            })()}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-classical-crimson/10 border border-classical-crimson/30 text-red-300 rounded-lg text-center text-sm relative z-10 break-words">
              {error}
            </div>
          )}

          {/* --- RESULTS WITH TIMELINE & FEEDBACK --- */}
          {result && !loading && (
            <div className="flex flex-col items-center w-full mt-10 animate-fade-in-up relative z-10">

              {/* Main Prediction */}
              <div ref={resultCardRef} className="w-full bg-[#FDF4DF] p-6 rounded-2xl border border-[#D4AF37] text-center shadow-md">
                <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold mb-2">Dominant Cycle</p>
                <h2 className="text-4xl font-serif font-bold text-[#8B3A2B] mb-1 drop-shadow-sm">
                  {result.prediction}
                </h2>
                <p className="text-stone-700 font-medium text-sm">
                  Confidence: <span className="font-bold text-stone-900">{result.confidence}%</span>
                </p>

                {/* THE TIMELINE VISUALIZER */}
                {result.timeline && result.timeline.length > 0 && (() => {
                  const TAAL_COLORS = {
                    TEENTAAL: { bg: "bg-[#8B3A2B]", swatch: "#8B3A2B", label: "Teentaal" },
                    DADRA:    { bg: "bg-[#D4AF37]", swatch: "#D4AF37", label: "Dadra" },
                    BHAJANI:  { bg: "bg-[#4A5D23]", swatch: "#4A5D23", label: "Bhajani" },
                    SILENT:   { bg: "bg-stone-400", swatch: "#A8A29E", label: "Silent / no beat" },
                  };
                  const presentTaals = Array.from(new Set(result.timeline.map(c => c.prediction)))
                    .filter(t => TAAL_COLORS[t]);

                  return (
                    <div className="mt-6 pt-6 border-t border-[#D4AF37]/30">
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-3">Rhythmic Timeline (20s Chunks)</p>

                      {/* SCRUBBER INFO BAR — replaces the native browser tooltip */}
                      <div className="h-6 mb-2 flex items-center justify-center text-xs font-mono px-2 bg-stone-100 border border-stone-200 rounded-md">
                        {hoveredChunk ? (
                          <span className="flex items-center gap-2 text-stone-700">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-sm"
                              style={{ backgroundColor: (TAAL_COLORS[hoveredChunk.prediction] ?? TAAL_COLORS.SILENT).swatch }}
                            ></span>
                            <span className="font-semibold">
                              {formatTime(hoveredChunk.start_time)}&nbsp;–&nbsp;{formatTime(hoveredChunk.end_time)}
                            </span>
                            <span className="text-stone-400">·</span>
                            <span className="font-bold" style={{ color: (TAAL_COLORS[hoveredChunk.prediction] ?? TAAL_COLORS.SILENT).swatch }}>
                              {hoveredChunk.prediction}
                            </span>
                            <span className="text-stone-400">·</span>
                            <span>{hoveredChunk.confidence}% conf.</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Hover any segment to inspect</span>
                        )}
                      </div>

                      <div
                        className="flex w-full h-8 rounded-md overflow-hidden shadow-inner bg-stone-200"
                        onMouseLeave={() => setHoveredChunk(null)}
                      >
                        {result.timeline.map((chunk, idx) => {
                          const c = TAAL_COLORS[chunk.prediction] ?? TAAL_COLORS.SILENT;
                          const isHovered = hoveredChunk === chunk;
                          return (
                            <div
                              key={idx}
                              onMouseEnter={() => setHoveredChunk(chunk)}
                              className={`flex-1 h-full ${c.bg} border-r border-white/20 transition-all cursor-pointer ${
                                isHovered ? 'opacity-100 ring-2 ring-white/60 ring-inset z-10' : 'opacity-100 hover:opacity-90'
                              }`}
                            ></div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
                        <span>0:00</span>
                        <span>{formatTime(result.timeline[result.timeline.length - 1].end_time)}</span>
                      </div>

                      {/* COLOR LEGEND */}
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
                        {presentTaals.map((taal) => (
                          <div key={taal} className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-3 h-3 rounded-sm border border-black/10"
                              style={{ backgroundColor: TAAL_COLORS[taal].swatch }}
                            ></span>
                            <span className="text-[10px] text-stone-600 uppercase tracking-wider font-semibold">
                              {TAAL_COLORS[taal].label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* THE FEEDBACK LOOP */}
              <div className="w-full mt-4 bg-stone-800/50 backdrop-blur-sm p-4 rounded-xl border border-stone-700 flex flex-col items-center">
                {feedbackStatus === "idle" && (
                  <>
                    <p className="text-xs text-[#D4AF37] tracking-wider uppercase mb-3">Was this prediction correct?</p>
                    <div className="flex space-x-3 w-full">
                      <button
                        onClick={() => submitFeedback(true)}
                        className="flex-1 py-2 bg-stone-700/50 hover:bg-stone-600 text-stone-200 text-sm font-semibold rounded-lg border border-stone-600 transition-colors"
                      >
                        👍 Yes
                      </button>
                      <button
                        onClick={() => setFeedbackStatus("asking")}
                        className="flex-1 py-2 bg-stone-700/50 hover:bg-stone-600 text-stone-200 text-sm font-semibold rounded-lg border border-stone-600 transition-colors"
                      >
                        👎 No
                      </button>
                    </div>
                  </>
                )}

                {feedbackStatus === "asking" && (
                  <div className="w-full flex flex-col items-center animate-fade-in">
                    <p className="text-xs text-[#D4AF37] tracking-wider uppercase mb-3">What was the actual Taal?</p>
                    <div className="grid grid-cols-3 gap-2 w-full">
                      {["TEENTAAL", "DADRA", "BHAJANI"].map((taal) => (
                        <button
                          key={taal}
                          onClick={() => submitFeedback(false, taal)}
                          className="py-2 bg-stone-700 hover:bg-[#8B3A2B] text-white text-[11px] font-bold tracking-wider rounded-md transition-colors"
                        >
                          {taal}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {feedbackStatus === "submitted" && (
                  <p className="text-sm text-[#D4AF37] font-medium py-2 animate-fade-in">Thank you for helping train Taal AI! 🙏</p>
                )}
              </div>

              <div className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={downloadAsImage}
                  className="py-3.5 bg-[#D4AF37] text-stone-900 font-bold tracking-widest uppercase rounded-lg hover:bg-[#E5BC4A] transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span aria-hidden="true">⤓</span> Download Image
                </button>
                <button
                  onClick={() => { setResult(null); setFeedbackStatus("idle"); }}
                  className="py-3.5 border-2 border-[#D4AF37] text-[#D4AF37] font-bold tracking-widest uppercase rounded-lg hover:bg-[#D4AF37] hover:text-stone-900 transition-all shadow-sm"
                >
                  Analyze Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}