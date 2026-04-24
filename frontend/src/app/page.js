import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-classical-wood/40 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-classical-gold/10 rounded-full blur-[120px]"></div>

      <div className="relative z-10 max-w-3xl">
        <h2 className="text-classical-gold tracking-[0.5em] text-sm md:text-base mb-6 font-bold uppercase drop-shadow-md">
          Deep Learning meets Classical Rhythm
        </h2>
        
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-white mb-8 leading-tight drop-shadow-2xl">
          Decoding the <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-classical-gold to-[#FFECB3]">
            Ancient Beat.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-classical-sand/80 mb-12 font-light leading-relaxed">
          Upload an audio file and let our Convolutional Neural Network decipher the intricate mathematical structures of Hindustani percussion.
        </p>

        <Link 
          href="/classify" 
          className="inline-block px-12 py-5 bg-gradient-to-b from-classical-gold to-[#B8860B] text-classical-dark font-serif font-bold tracking-widest rounded-full shadow-[0_0_30px_rgba(229,169,55,0.4)] hover:shadow-[0_0_50px_rgba(229,169,55,0.8)] hover:scale-105 transition-all duration-300"
        >
          ENTER THE STUDIO
        </Link>
      </div>
    </div>
  );
}