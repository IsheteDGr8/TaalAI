import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 relative overflow-hidden bg-indian-bg">
      
      {/* Decorative Background Rings (Representing Rhythmic Cycles) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-indian-gold/20 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[2px] border-indian-brown/10 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-[1px] border-indian-gold/30 rounded-full"></div>

      {/* Main Glass Panel */}
      <div className="relative z-10 text-center max-w-4xl w-full p-10 md:p-16 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl">
        <h2 className="text-sm md:text-base font-bold tracking-[0.4em] text-indian-gold mb-4 uppercase drop-shadow-sm">
          The Rhythm of AI
        </h2>
        <h1 className="text-5xl md:text-8xl font-serif font-bold text-indian-dark mb-6 tracking-tight">
          Taal <span className="text-indian-earth italic font-light">&</span> Tech
        </h1>
        <p className="text-lg md:text-2xl text-indian-brown/90 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
          An end-to-end deep learning architecture trained to decode the ancient, percussive cycles of Hindustani Classical Music.
        </p>
        
        <Link 
          href="/classify" 
          className="group relative inline-flex items-center justify-center px-10 py-5 font-serif tracking-widest text-lg text-indian-bg bg-indian-dark rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-indian-brown hover:shadow-[0_0_40px_-10px_rgba(212,175,55,0.8)]"
        >
          <span className="relative">COMMENCE ANALYSIS</span>
        </Link>
      </div>

    </div>
  );
}