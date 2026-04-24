import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {/* Main Container: Constrains width and handles overall vertical padding */}
      <main className="max-w-5xl mx-auto w-full px-6 py-16 md:py-24 flex flex-col items-center justify-center flex-grow space-y-12">

        {/* Header Section: Vertical spacing (space-y-4) keeps the title and subtitle logically grouped */}
        <div className="text-center space-y-4 w-full">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Taal AI
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            End-to-End Audio Classification System for Indian Classical Rhythmic Cycles.
          </p>
        </div>

        {/* Primary Action Card: A white card with padding (p-8) to separate the action from the background */}
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 flex flex-col items-center space-y-8">
          
          {/* Upload / Input Area Indicator */}
          <div className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer group">
            <svg className="w-10 h-10 text-gray-400 mb-3 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="text-gray-600 font-medium text-center">Drag and drop audio file here</p>
            <p className="text-sm text-gray-400 mt-2">Supports .wav, .mp3</p>
          </div>

          {/* Navigation/Action Button */}
          <Link
            href="/classify"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Start Classification
          </Link>
        </div>
      </main>
    </div>
  );
}