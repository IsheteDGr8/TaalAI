"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">

        {/* Left: Brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-blue-700 transition-colors">
              T
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Taal AI</span>
          </Link>
        </div>

        {/* Center: Navigation (spaced horizontally) */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-10">
          <Link href="/classify" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Classify
          </Link>
          <Link href="/learn" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Learn
          </Link>
          <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            About
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 ml-4">
          <a
            href="https://github.com/ishetedgr8/taalai"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            GitHub
          </a>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen((s) => !s)}
              aria-expanded={open}
              aria-label="Toggle navigation"
              className="text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              {open ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Mobile menu */}
      <div className={`${open ? 'block' : 'hidden'} md:hidden bg-white border-t border-gray-100 shadow-sm`}>
        <div className="px-6 py-4 space-y-3">
          <Link href="/classify" className="block text-gray-700 font-medium hover:text-blue-600" onClick={() => setOpen(false)}>
            Classify
          </Link>
          <Link href="/learn" className="block text-gray-700 font-medium hover:text-blue-600" onClick={() => setOpen(false)}>
            Learn
          </Link>
          <Link href="/about" className="block text-gray-700 font-medium hover:text-blue-600" onClick={() => setOpen(false)}>
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}