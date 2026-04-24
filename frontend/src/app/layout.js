import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Taal AI',
  description: 'End-to-End Audio Classification System for Indian Classical Rhythmic Cycles',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* min-h-screen and flex-col are crucial for the sticky footer layout */}
      <body className="flex flex-col min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Navbar />

        {/* flex-grow pushes the footer to the bottom; inner container adds spacing */}
        <main className="flex-grow w-full">
          <div className="max-w-5xl mx-auto px-6 py-12 w-full">
            {children}
          </div>
        </main>

        <Footer />
      </body>
    </html>
  );
}