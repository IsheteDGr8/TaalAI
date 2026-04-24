import Link from "next/link";

export default function Learn() {
  const taals = [
    {
      name: "Teentaal",
      beats: 16,
      structure: "4 + 4 + 4 + 4",
      description: "The most prominent rhythmic cycle in Hindustani classical music. It is highly symmetrical, providing a vast canvas for complex improvisations."
    },
    {
      name: "Bhajani",
      beats: 8,
      structure: "4 + 4",
      description: "A deeply devotional and steady rhythm widely used in light classical music, bhajans, and folk compositions. Its even split creates a comforting, rolling momentum."
    },
    {
      name: "Dadra",
      beats: 6,
      structure: "3 + 3",
      description: "A lively, syncopated cycle divided into two equal halves. It is commonly used in semi-classical forms like Thumri and Ghazals, characterized by its waltz-like swing."
    }
  ];

  return (
    <div className="flex-grow flex flex-col items-center p-6 md:p-12 bg-indian-bg relative">
      <div className="max-w-5xl w-full relative z-10">
        
        <div className="text-center mb-16 md:mb-24 mt-8">
          <h2 className="text-sm font-bold tracking-[0.4em] text-indian-gold mb-4 uppercase">Music Theory</h2>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-indian-dark mb-6 drop-shadow-sm">The Anatomy of Taal</h1>
          <div className="h-1 w-24 bg-indian-gold mx-auto mb-6 rounded-full opacity-50"></div>
          <p className="text-xl text-indian-earth max-w-2xl mx-auto font-medium leading-relaxed">
            A <i className="font-serif">Taal</i> is a repeating rhythmic pattern. Our Convolutional Neural Network has been trained to visually identify the mathematical symmetry of these three specific cycles.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {taals.map((taal) => (
            <div 
              key={taal.name} 
              className="group relative bg-gradient-to-br from-white to-[#FAF4E6] border border-indian-gold/30 rounded-2xl p-8 shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-indian-gold/60 transition-all duration-300 flex flex-col h-full"
            >
              <div className="absolute top-0 right-8 w-16 h-1 bg-indian-gold/40 rounded-b-full transition-all group-hover:h-2 group-hover:bg-indian-gold"></div>
              
              <div className="mb-6">
                <h2 className="text-4xl font-serif font-bold text-indian-dark mb-2">{taal.name}</h2>
                <div className="inline-block px-3 py-1 bg-indian-brown/10 text-indian-brown text-xs font-bold tracking-widest rounded-full">
                  {taal.beats} MATRAS
                </div>
              </div>
              
              <p className="text-indian-earth mb-8 flex-grow leading-relaxed">
                {taal.description}
              </p>
              
              <div className="bg-indian-dark rounded-xl p-4 text-center border-t-4 border-indian-gold shadow-inner">
                <p className="text-xs text-indian-bg/60 tracking-widest uppercase mb-1">Structure</p>
                <p className="font-mono text-xl tracking-[0.3em] text-indian-gold font-bold">
                  {taal.structure}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link href="/classify" className="inline-block px-10 py-4 border-2 border-indian-dark text-indian-dark font-serif font-bold tracking-widest rounded-full hover:bg-indian-dark hover:text-indian-bg transition-colors shadow-lg">
            TEST THE AI ENGINE
          </Link>
        </div>

      </div>
    </div>
  );
}