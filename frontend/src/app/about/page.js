import Link from "next/link";

export default function About() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 bg-gradient-to-b from-indian-bg to-[#EFE5CE]">
      <div className="max-w-4xl w-full bg-white/60 backdrop-blur-xl border border-indian-gold/30 rounded-3xl shadow-2xl p-8 md:p-16 relative overflow-hidden">
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-indian-gold/20 rounded-tl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-indian-gold/20 rounded-br-3xl"></div>

        <div className="flex flex-col items-center text-center mb-12 relative z-10">
          <div className="w-28 h-28 bg-gradient-to-br from-indian-dark to-indian-brown rounded-full flex items-center justify-center text-indian-gold text-4xl font-serif mb-6 shadow-xl border-4 border-[#FAF4E6]">
            IS
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-indian-dark mb-4">Ishaan Shete</h1>
          <p className="text-indian-brown tracking-[0.2em] text-sm md:text-base font-bold uppercase bg-indian-gold/10 px-6 py-2 rounded-full">
            Computer Science & Software Engineering
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 text-indian-earth text-lg leading-relaxed font-medium relative z-10">
          <div className="space-y-6">
            <p>
              I am a senior at the University of Washington Bothell, graduating in June 2026. My core technical focus lies at the intersection of Machine Learning, Generative AI, and their practical integration into edge hardware and scalable cloud architectures.
            </p>
            <p>
              Beyond audio classification, my engineering work spans multiple domains—from developing AI risk detection algorithms for full-stack platforms to writing UART-based cooling activation logic for Mars Rover prototypes.
            </p>
          </div>
          <div className="space-y-6 md:border-l-2 md:border-indian-gold/30 md:pl-10">
            <p>
              <strong className="text-indian-dark font-serif text-xl block mb-2">The Origin of Taal AI</strong>
              This platform was built to bridge my technical engineering coursework with my historical study of Sanskrit and Indian classical music. 
            </p>
            <p>
              Translating ancient, complex percussive cycles into pure mathematical matrices that a Convolutional Neural Network can understand represents the exact kind of cross-disciplinary problem-solving I am passionate about.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-indian-gold/30 flex flex-col sm:flex-row justify-center items-center gap-6 relative z-10">
          <Link href="https://github.com/IsheteDGr8" target="_blank" className="w-full sm:w-auto text-center px-10 py-4 border-2 border-indian-brown text-indian-brown font-serif font-bold tracking-widest rounded-full hover:bg-indian-brown hover:text-[#FAF4E6] transition-all shadow-md hover:shadow-xl">
            VIEW GITHUB
          </Link>
          <Link href="mailto:your.email@uw.edu" className="w-full sm:w-auto text-center px-10 py-4 bg-indian-dark text-indian-gold font-serif font-bold tracking-widest rounded-full shadow-lg hover:bg-indian-brown transition-all hover:shadow-xl hover:-translate-y-1">
            CONTACT ME
          </Link>
        </div>

      </div>
    </div>
  );
}