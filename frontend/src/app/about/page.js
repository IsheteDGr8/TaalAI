import Link from "next/link";

export default function About() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 relative">
      <div className="max-w-4xl w-full bg-[#241712] border border-classical-gold/20 rounded-3xl p-8 md:p-16 shadow-2xl relative z-10">
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
          
          {/* Avatar Area */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-32 h-32 bg-classical-dark rounded-full flex items-center justify-center text-classical-gold text-4xl font-serif shadow-inner border-2 border-classical-gold/50 mb-4">
              IS
            </div>
            <Link href="https://github.com/IsheteDGr8" target="_blank" className="text-sm text-classical-sand hover:text-classical-gold tracking-widest uppercase transition-colors">
              GitHub Profile ↗
            </Link>
          </div>

          {/* Bio Area */}
          <div className="flex-grow text-center md:text-left space-y-6">
            <div>
              <h1 className="text-4xl font-serif font-bold text-white mb-2">Ishaan Shete</h1>
              <p className="text-classical-gold tracking-[0.2em] text-sm font-bold uppercase">
                Machine Learning & Edge Computing
              </p>
            </div>

            <div className="text-classical-sand/80 leading-relaxed font-light space-y-4">
              <p>
                I am a senior studying Computer Science and Software Engineering at UW Bothell. I enjoy blending my fascination with classical, structured concepts—like the Sanskrit language and traditional Indian music—with modern, scalable machine learning architectures.
              </p>
              <p>
                Taal AI represents exactly that intersection: translating ancient rhythmic cycles into deep learning pipelines. 
              </p>
              <p>
                Beyond audio analysis, my recent engineering work focuses on solving complex systemic challenges, from building AI risk detection pipelines for FlowScope to programming UART hardware communications for Mars Rover prototypes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}