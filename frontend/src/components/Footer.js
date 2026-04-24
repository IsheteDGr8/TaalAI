import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center w-full">

        {/* Left */}
        <div className="flex items-center">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Taal AI.</p>
        </div>

        {/* Center */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-8">
          <Link href="/about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            About Project
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/ishetedgr8/taalai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            GitHub
          </a>
        </div>

      </div>
    </footer>
  );
}