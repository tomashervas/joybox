'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Song {
  id: string;
  title: string;
}

interface SongDropdownProps {
  category: string;
  songs: Song[];
}

export default function SongDropdown({ category, songs }: SongDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-3 text-xl font-bold text-left text-white rounded-lg shadow-neon-primary transition-all duration-300 hover:shadow-secondary" 
      >
        {category}
      </button>
      {isOpen && (
        <div className="mt-4 bg-background border-primary rounded-lg">
          {songs.map((song) => (
            <Link
              key={song.id}
              href={`/dropped-tiles/game/${song.id}`}
              className="block px-6 py-3 text-lg text-primary hover:text-secondary"
            >
              {song.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}