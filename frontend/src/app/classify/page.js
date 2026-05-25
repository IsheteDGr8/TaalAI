"use client";

import { useState, useRef } from "react";
import { supabase } from "@/utils/supabase";

export default function Classify() {
  const [inputType, setInputType] = useState("file"); // 'file' or 'youtube'
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState("idle"); // 'idle' | 'asking' | 'submitted'
  const [hoveredChunk, setHoveredChunk] = useState(null);
  const fileInputRef = useRef(null);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (inputType === "file" && !file) {
      setError("Please select an audio file first.");
      return;
    }
    if (inputType === "youtube" && !youtubeUrl.trim()) {
      setError("Please enter a valid YouTube URL.");
      return;
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

      if (inputType === "file") {
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

      console.log("[Taal AI] Calling backend:", `${apiBase}/predict`);
      const response = await fetch(`${apiBase}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: targetUrl }),
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
      const source = inputType === "youtube" ? youtubeUrl : file?.name;
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

      {/* --- THE MEHRAB ARCHWAY CONTAINER --- */}
      <div className="max-w-2xl w-full relative z-10 pt-8">
        
        {/* The Architectural Frame Layers */}
        <div className="absolute inset-0 bg-[#241712]/90 backdrop-blur-2xl border-x-2 border-b-2 border-classical-wood/60 border-t-4 border-t-classical-gold rounded-t-[140px] rounded-b-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-none">
          {/* Inner Gold Arch */}
          <div className="absolute top-3 left-3 right-3 bottom-3 border border-classical-gold/20 rounded-t-[130px] rounded-b-xl shadow-[inset_0_0_30px_rgba(229,169,55,0.05)]"></div>
        </div>

        <div className="relative z-20 p-8 md:p-14 pt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Analysis Engine</h2>
            <div className="h-1 w-16 bg-classical-gold mx-auto rounded-full mb-4 opacity-50"></div>
          </div>

          {/* Input Toggle */}
          <div className="flex justify-center mb-8 bg-classical-wood/20 p-1 rounded-full w-fit mx-auto border border-classical-wood/50">
            <button 
              onClick={() => { setInputType('file'); setError(null); setResult(null); }}
              className={`px-6 py-2 rounded-full text-sm font-bold tracking-widest transition-all ${inputType === 'file' ? 'bg-classical-gold text-classical-dark shadow-md' : 'text-classical-sand/70 hover:text-white'}`}
            >
              FILE UPLOAD
            </button>
            <button 
              onClick={() => { setInputType('youtube'); setError(null); setResult(null); }}
              className={`px-6 py-2 rounded-full text-sm font-bold tracking-widest transition-all ${inputType === 'youtube' ? 'bg-classical-gold text-classical-dark shadow-md' : 'text-classical-sand/70 hover:text-white'}`}
            >
              YOUTUBE
            </button>
          </div>

          {/* Interactive Dropzone / Input Area */}
          {inputType === "file" ? (
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
          ) : (
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
                  {inputType === 'youtube' ? 'EXTRACTING AUDIO...' : 'LISTENING...'}
                </span>
              </div>
            ) : (
              <button
                onClick={handleAnalyze}
                disabled={inputType === 'file' ? !file : !youtubeUrl.trim()}
                className={`w-full py-5 rounded-xl font-bold tracking-[0.2em] transition-all duration-500 ${
                  (inputType === 'file' ? !file : !youtubeUrl.trim())
                    ? 'bg-classical-dark text-classical-sand/30 border border-classical-wood cursor-not-allowed' 
                    : 'bg-classical-wood text-classical-gold hover:bg-classical-gold hover:text-classical-dark hover:shadow-[0_0_30px_rgba(229,169,55,0.4)] border border-classical-gold/50'
                }`}
              >
                COMMENCE CLASSIFICATION
              </button>
            )}
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
              <div className="w-full bg-[#FDF4DF] p-6 rounded-2xl border border-[#D4AF37] text-center shadow-md">
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

              <button
                onClick={() => { setResult(null); setFeedbackStatus("idle"); }}
                className="mt-6 w-full py-3.5 border-2 border-[#D4AF37] text-[#D4AF37] font-bold tracking-widest uppercase rounded-lg hover:bg-[#D4AF37] hover:text-stone-900 transition-all shadow-sm"
              >
                Analyze Another
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}