import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Taal AI | Classical Rhythm Detection",
  description: "Machine Learning architecture for Indian Classical audio classification.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col font-sans">
        
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 w-full bg-indian-brown text-indian-bg shadow-md border-b-4 border-indian-gold">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-serif font-bold tracking-widest text-indian-gold hover:text-white transition-colors">
              TAAL AI
            </Link>
            <div className="hidden md:flex space-x-8 font-medium tracking-wide text-sm">
              <Link href="/" className="hover:text-indian-gold transition-colors">HOME</Link>
              <Link href="/classify" className="hover:text-indian-gold transition-colors">CLASSIFY</Link>
              <Link href="/learn" className="hover:text-indian-gold transition-colors">LEARN</Link>
              <Link href="/about" className="hover:text-indian-gold transition-colors">ABOUT</Link>
            </div>
            {/* Mobile Menu Placeholder */}
            <div className="md:hidden text-indian-gold font-serif font-bold">
              ॥
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-grow flex flex-col">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-indian-dark text-indian-bg py-6 text-center text-sm border-t border-indian-brown">
          <p className="opacity-70">Built with FastAPI, TensorFlow, and Next.js</p>
        </footer>

      </body>
    </html>
  );
}