import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Taal AI | Classical Rhythm Detection",
  description: "Machine Learning architecture for Indian Classical audio classification.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col font-sans selection:bg-classical-gold selection:text-classical-dark">
        
        {/* Floating Glass Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-classical-dark/80 backdrop-blur-lg border-b border-classical-gold/20">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-serif font-bold tracking-widest text-classical-gold hover:text-white transition-colors drop-shadow-md">
              TAAL AI
            </Link>
            <div className="flex space-x-6 md:space-x-10 text-xs md:text-sm font-bold tracking-[0.2em] text-classical-sand">
              <Link href="/classify" className="hover:text-classical-gold transition-colors">ANALYZE</Link>
              <Link href="/theory" className="hover:text-classical-gold transition-colors">THEORY</Link>
              <Link href="/about" className="hover:text-classical-gold transition-colors">DEVELOPER</Link>
            </div>
          </div>
        </nav>

        {/* Add top padding so content clears the fixed nav */}
        <main className="flex-grow flex flex-col pt-20">
          {children}
        </main>

      </body>
    </html>
  );
}