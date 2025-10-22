'use client';

import Link from 'next/link';
import DroppedTilesGame from '@/components/dropped-tiles/Game';

export default function GamePage() {
  return (
    <main className="relative w-screen h-screen bg-gray-900">
      <DroppedTilesGame />
      <Link
        href="/dropped-tiles"
        className="absolute top-4 left-4 z-50 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white font-bold p-3 rounded-full transition-all duration-200"
        aria-label="Volver"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </main>
  );
}