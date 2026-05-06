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
            <Link href="https://www.linkedin.com/in/ishaan-shete/" target="_blank" className="text-sm text-classical-sand hover:text-classical-gold tracking-widest uppercase transition-colors">
              LinkedIn Profile ↗
            </Link>
            <Link href="mailto:ishaanbshete@gmail.com" className="text-sm text-classical-sand hover:text-classical-gold tracking-widest uppercase transition-colors">
              Contact Me ↗
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
                I am a senior studying Computer Science and Software Engineering at UW Bothell. I enjoy blending my passions for music and technology, which is why I founded Taal AI: a platform that uses deep learning to analyze and generate Indian classical music, specifically focusing on the intricate rhythmic patterns known as &quot;taals&quot;.
              </p>
              <p>
                I have a strong background of Tabla, with 18+ years of experience, and I have been fortunate to share the stage with renowned artists such as Ustad Zakir Hussain. With over 5 Gurus, I have had the privellage to experience compositions and styles from a diverse set of gharanas.
              </p>
              <p>
                Beyond audio analysis, my experience focuses on machine learning, full-stack development, and edge computing. I am passionate about leveraging technology to create innovative solutions that bridge the gap between tradition and modernity in the world of music.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}