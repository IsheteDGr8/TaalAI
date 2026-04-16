"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
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
      // 1. Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // 2. Upload the audio file directly to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-uploads')
        .upload(fileName, file);

      if (uploadError) throw new Error("Failed to upload audio to storage.");

      // 3. Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('audio-uploads')
        .getPublicUrl(fileName);

      const audioUrl = publicUrlData.publicUrl;

      // 4. Send the URL to your Render FastAPI microservice
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: audioUrl }),
      });

      const predictionData = await response.json();

      if (!response.ok || predictionData.error) {
        throw new Error(predictionData.error || "Failed to analyze audio.");
      }

      // 5. Display the result
      setResult(predictionData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-800">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Taal AI</h1>
          <p className="text-gray-500">
            Upload an audio file to detect the rhythmic cycle (Teentaal, Dadra, Bhajani).
          </p>
        </div>

        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 text-center hover:border-blue-500 transition-colors">
          <input 
            type="file" 
            accept="audio/*" 
            onChange={handleFileChange} 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !file}
          className={`w-full py-3 rounded-md font-semibold text-white transition-all ${
            loading || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Audio...
            </span>
          ) : (
            "Analyze Audio"
          )}
        </button>

        {/* Error State */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results State */}
        {result && (
          <div className="mt-8 p-6 bg-gray-100 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-center text-green-700 mb-4">
              Prediction: {result.prediction}
            </h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Confidence:</strong> {result.confidence}%</p>
              
              <div className="pt-4 mt-4 border-t border-gray-300">
                <p className="font-semibold mb-2">Vote Breakdown (Chunks):</p>
                <pre className="bg-white p-3 rounded-md text-sm shadow-inner overflow-x-auto">
                  {JSON.stringify(result.vote_breakdown, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}