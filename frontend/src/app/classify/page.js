"use client";

import { useState, useRef } from "react";
import { supabase } from "@/utils/supabase";

export default function Classify() {
  const [file, setFile] = useState(null);
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
    if (!file) {
      setError("Please select an audio file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('audio-uploads').upload(fileName, file);
      if (uploadError) throw new Error("Failed to upload audio to storage.");

      const { data: publicUrlData } = supabase.storage.from('audio-uploads').getPublicUrl(fileName);
      const audioUrl = publicUrlData.publicUrl;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: audioUrl }),
      });

      const predictionData = await response.json();
      if (!response.ok || predictionData.error) throw new Error(predictionData.error || "Failed to analyze audio.");

      setResult(predictionData);
      await supabase.storage.from('audio-uploads').remove([fileName]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-[#241712]/80 backdrop-blur-xl border border-classical-wood/50 rounded-3xl shadow-2xl p-8 md:p-12">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Analysis Engine</h2>
          <div className="h-1 w-16 bg-classical-gold mx-auto rounded-full mb-4 opacity-50"></div>
          <p className="text-classical-sand/70 text-sm">Upload a clean .wav file. The AI analyzes the first 60 seconds.</p>
        </div>

        {/* Interactive Dropzone */}
        <div 
          onClick={() => fileInputRef.current.click()}
          className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group ${
            file ? 'border-classical-gold bg-classical-gold/5' : 'border-classical-wood hover:border-classical-gold hover:bg-classical-wood/20'
          }`}
        >
          <input type="file" accept="audio/wav" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
          
          <div className="relative z-10 flex flex-col items-center">
            <span className={`text-4xl mb-4 transition-transform duration-300 ${file ? 'scale-110' : 'group-hover:-translate-y-2'}`}>
              {file ? '🎵' : '🎙️'}
            </span>
            <div className="font-serif text-lg text-white">
              {file ? file.name : "Tap to browse audio files"}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !file}
          className={`mt-8 w-full py-5 rounded-xl font-bold tracking-[0.2em] transition-all duration-300 ${
            loading || !file 
              ? 'bg-classical-dark text-classical-sand/30 border border-classical-wood cursor-not-allowed' 
              : 'bg-classical-wood text-classical-gold hover:bg-classical-gold hover:text-classical-dark hover:shadow-[0_0_20px_rgba(229,169,55,0.4)] border border-classical-gold/50'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center animate-pulse">
              <span className="mr-3 text-xl animate-spin">⚙️</span> EXTRACTING FEATURES...
            </span>
          ) : "COMMENCE CLASSIFICATION"}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-classical-crimson/20 border border-classical-crimson/50 text-red-200 rounded-lg text-center text-sm">
            {error}
          </div>
        )}

        {/* Result Dashboard */}
        {result && (
          <div className="mt-10 p-1 bg-gradient-to-b from-classical-gold to-classical-wood rounded-2xl animate-glow-pulse">
            <div className="bg-[#1A1210] rounded-xl p-8">
              <h3 className="text-center text-xs tracking-[0.3em] text-classical-sand/50 uppercase mb-2">Dominant Cycle</h3>
              <h2 className="text-5xl font-serif font-bold text-center text-classical-gold capitalize mb-8 drop-shadow-md">
                {result.prediction}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 border-t border-classical-wood pt-6">
                <div className="text-center border-r border-classical-wood">
                  <p className="text-xs tracking-widest text-classical-sand/60 uppercase mb-2">Confidence</p>
                  <p className="text-2xl font-bold text-white">{(result.confidence * 100).toFixed(1)}%</p>
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
  );
}