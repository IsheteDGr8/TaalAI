import Link from "next/link";

export default function Theory() {
  const taals = [
    {
      name: "Teentaal",
      beats: 16,
      structure: "4 + 4 + 4 + 4",
      description: "The absolute king of rhythmic cycles. Highly symmetrical and deeply mathematical, providing a massive 16-beat canvas for complex percussive improvisations."
    },
    {
      name: "Bhajani",
      beats: 8,
      structure: "4 + 4",
      description: "A steady, rolling rhythm widely used in devotional music. Its clean, even split creates a comforting momentum that naturally loops back onto itself."
    },
    {
      name: "Dadra",
      beats: 6,
      structure: "3 + 3",
      description: "A lively, syncopated cycle divided into two equal halves. It swings like a waltz and is the backbone of light semi-classical forms like Thumri."
    }
  ];

  return (
    <div className="flex-grow flex flex-col items-center p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-classical-wood/30 rounded-full blur-[120px]"></div>

      <div className="max-w-5xl w-full relative z-10">
        
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-sm font-bold tracking-[0.4em] text-classical-gold mb-4 uppercase drop-shadow-md">
            The Mathematics of Music
          </h2>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-white mb-6">
            The Anatomy of Taal
          </h1>
          <div className="h-1 w-24 bg-classical-wood mx-auto mb-6 rounded-full"></div>
          <p className="text-lg text-classical-sand/80 max-w-2xl mx-auto font-light leading-relaxed">
            A <i className="font-serif text-classical-gold">Taal</i> is a repeating rhythmic pattern. Our AI is trained to &quot;see&quot; the structural symmetry of these specific cycles by converting audio into mathematical heat-maps.
          </p>
        </div>

        {/* --- MANUSCRIPT BORDER CARDS --- */}
        <div className="grid md:grid-cols-3 gap-8">
          {taals.map((taal) => (
            <div key={taal.name} className="relative bg-[#241712]/50 p-2 rounded-sm border border-classical-wood/50 hover:-translate-y-2 transition-all duration-500 shadow-xl group cursor-default">
              
              {/* Layer 1: Outer Gold Frame */}
              <div className="absolute inset-1 border border-classical-gold/30 group-hover:border-classical-gold/70 pointer-events-none transition-colors duration-500"></div>
              
              {/* Layer 2: Inner Delicate Line */}
              <div className="absolute inset-2 border-[0.5px] border-classical-gold/10 group-hover:border-classical-gold/40 pointer-events-none transition-colors duration-500"></div>
              
              {/* Inner Content Block */}
              <div className="bg-[#1A1210]/90 backdrop-blur-md p-8 h-full flex flex-col relative z-10">
                <div className="mb-6 flex justify-between items-start">
                  <h2 className="text-3xl font-serif font-bold text-white group-hover:text-classical-gold transition-colors">{taal.name}</h2>
                </div>
                
                <div className="inline-block px-4 py-1.5 bg-classical-dark border border-classical-wood text-classical-sand text-xs font-bold tracking-[0.2em] rounded-full mb-6 w-max">
                  {taal.beats} MATRAS
                </div>
                
                <p className="text-classical-sand/70 mb-8 flex-grow leading-relaxed font-light text-sm md:text-base">
                  {taal.description}
                </p>
                
                <div className="bg-[#1A1210] rounded-xl p-5 text-center border-t border-classical-wood group-hover:border-classical-gold/30 transition-colors">
                  <p className="text-[10px] text-classical-sand/40 tracking-[0.3em] uppercase mb-2">Structure</p>
                  <p className="font-mono text-xl tracking-[0.2em] text-classical-gold font-bold">
                    {taal.structure}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link href="/classify" className="inline-block px-10 py-4 border border-classical-wood text-classical-gold font-serif font-bold tracking-widest rounded-full hover:bg-classical-wood hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(229,169,55,0.2)]">
            RETURN TO ANALYSIS
          </Link>
        </div>

      </div>
    </div>
  );
}