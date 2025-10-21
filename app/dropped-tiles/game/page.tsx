'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function GamePage() {
  const searchParams = useSearchParams();
  const songId = searchParams.get('song');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-center text-[--color-accent]" style={{ textShadow: '0 0 10px var(--color-accent)' }}>
        Now Playing: {songId}
      </h1>
       <Link href="/" className="absolute top-8 left-8 px-4 py-2 text-lg font-bold text-white rounded-lg transition-all duration-300 hover:text-primary">
        { '<' }
      </Link>
    </main>
  );
}