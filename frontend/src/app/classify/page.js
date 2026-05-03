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
  const fileInputRef = useRef(null);

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

    setLoading(true);
    setError(null);
    setResult(null);

    let fileNameForCleanup = null;

    try {
      let targetUrl = "";

      // 1. Determine the URL based on the input mode
      if (inputType === "file") {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        fileNameForCleanup = fileName;

        const { error: uploadError } = await supabase.storage.from('audio-uploads').upload(fileName, file);
        if (uploadError) throw new Error("Failed to upload audio to storage.");

        const { data: publicUrlData } = supabase.storage.from('audio-uploads').getPublicUrl(fileName);
        targetUrl = publicUrlData.publicUrl;
      } else {
        targetUrl = youtubeUrl.trim();
      }

      // 2. Send to the AI Backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
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
      setError(err.message);
    } finally {
      // 3. Always clean up Supabase storage if a file was uploaded
      if (fileNameForCleanup) {
        await supabase.storage.from('audio-uploads').remove([fileNameForCleanup]);
      }
      setLoading(false);
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
              <input type="file" accept="audio/wav,audio/mp3" onChange={handleFileChange} ref={fileInputRef} className="hidden" disabled={loading} />
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

          {/* Result Dashboard */}
          {result && !loading && (
            <div className="mt-10 p-[1px] bg-gradient-to-b from-classical-gold/80 to-classical-wood rounded-2xl relative z-10 shadow-2xl">
              <div className="bg-[#1A1210] rounded-xl p-8">
                <h3 className="text-center text-xs tracking-[0.3em] text-classical-sand/50 uppercase mb-2">Dominant Cycle</h3>
                <h2 className="text-5xl font-serif font-bold text-center text-classical-gold capitalize mb-8 drop-shadow-md">
                  {result.prediction}
                </h2>
                
                <div className="grid grid-cols-2 gap-4 border-t border-classical-wood pt-6">
                  <div className="text-center border-r border-classical-wood">
                    <p className="text-xs tracking-widest text-classical-sand/60 uppercase mb-2">Confidence</p>
                    <p className="text-2xl font-bold text-white">
                      {/* Check if confidence comes as a decimal or percentage */}
                      {result.confidence <= 1 ? (result.confidence * 100).toFixed(1) : parseFloat(result.confidence).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs tracking-widest text-classical-sand/60 uppercase mb-2">Chunk Votes</p>
                    <div className="flex flex-col text-sm text-classical-gold font-medium">
                      {Object.entries(result.vote_breakdown || {}).map(([taal, votes]) => (
                        <span key={taal} className="capitalize">{taal}: {votes}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}