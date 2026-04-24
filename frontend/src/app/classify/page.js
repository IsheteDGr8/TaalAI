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

      const { error: uploadError } = await supabase.storage
        .from('audio-uploads')
        .upload(fileName, file);

      if (uploadError) throw new Error("Failed to upload audio to storage.");

      const { data: publicUrlData } = supabase.storage
        .from('audio-uploads')
        .getPublicUrl(fileName);

      const audioUrl = publicUrlData.publicUrl;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: audioUrl }),
      });

      const predictionData = await response.json();

      if (!response.ok || predictionData.error) {
        throw new Error(predictionData.error || "Failed to analyze audio.");
      }

      setResult(predictionData);

      // Auto-cleanup: Delete the file from Supabase after successful prediction
      await supabase.storage.from('audio-uploads').remove([fileName]);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indian-bg to-[#EFE5CE]">
      <div className="max-w-2xl w-full bg-white/60 backdrop-blur-md border border-indian-gold/30 rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
        
        {/* Decorative Background Element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indian-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indian-brown/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-10 relative z-10">
          <h2 className="text-sm font-bold tracking-[0.3em] text-indian-gold mb-2">ताल विश्लेषण</h2>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-indian-dark mb-4">Analyze Audio</h1>
          <p className="text-indian-earth font-medium">
            Upload a .wav file to detect the rhythmic cycle. <br/>
            <span className="text-sm opacity-80">(The engine will analyze the first 60 seconds of the track)</span>
          </p>
        </div>

        {/* Custom Upload Dropzone */}
        <div className="relative z-10 mb-8">
          <div 
            onClick={() => fileInputRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
              file ? 'border-indian-brown bg-indian-brown/5' : 'border-indian-gold/50 hover:bg-indian-gold/10 hover:border-indian-gold'
            }`}
          >
            <input 
              type="file" 
              accept="audio/wav" 
              onChange={handleFileChange} 
              ref={fileInputRef}
              className="hidden"
            />
            {file ? (
              <div className="text-indian-dark font-serif text-lg">
                <span className="block text-2xl mb-2">🎵</span>
                {file.name}
              </div>
            ) : (
              <div className="text-indian-earth font-serif text-lg">
                <span className="block text-3xl mb-2 opacity-50">📥</span>
                Click to browse for an audio file
              </div>
            )}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !file}
          className={`relative z-10 w-full py-4 rounded-lg font-serif tracking-widest text-lg transition-all duration-300 shadow-lg ${
            loading || !file 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
              : 'bg-indian-brown text-indian-bg hover:bg-indian-dark hover:shadow-indian-brown/50 hover:-translate-y-1'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center animate-pulse">
               Analyzing Frequencies...
            </span>
          ) : (
            "COMMENCE ANALYSIS"
          )}
        </button>

        {/* Error State */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-800 border-l-4 border-red-500 rounded-r-md relative z-10 shadow-sm">
            <p className="font-medium">Error processing audio:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="mt-10 p-8 border border-indian-gold/40 bg-gradient-to-br from-white to-indian-bg rounded-xl relative z-10 shadow-inner">
            <h3 className="text-center text-sm font-bold tracking-widest text-indian-earth mb-2 uppercase">Detected Cycle</h3>
            <h2 className="text-4xl font-serif font-bold text-center text-indian-dark mb-6 capitalize">
              {result.prediction}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 border-t border-indian-gold/20 pt-6">
              <div className="text-center">
                <p className="text-xs tracking-wider text-indian-earth uppercase mb-1">Confidence</p>
                <p className="text-2xl font-bold text-indian-brown">{(result.confidence * 100).toFixed(1)}%</p>
              </div>
              <div className="text-center border-l border-indian-gold/20">
                <p className="text-xs tracking-wider text-indian-earth uppercase mb-1">Chunk Votes</p>
                <div className="flex flex-col items-center justify-center text-sm text-indian-dark font-medium">
                  {Object.entries(result.vote_breakdown || {}).map(([taal, votes]) => (
                    <span key={taal} className="capitalize">{taal}: {votes}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}