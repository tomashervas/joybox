import Link from 'next/link';
import SongDropdown from '@/components/SongDropdown';

export default function DroppedTilesMenu() {
  const classicalSongs = [
    { id: 'fur_elise', title: 'Para Elisa' },
    { id: 'moonlight_sonata', title: 'Moonlight sonata' },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center p-12 mt-10">
      <h1 className="text-5xl font-bold text-center text-secondary" style={{ textShadow: '0 0 10px #00ffff' }}>
        DroppedTiles
      </h1>
      <SongDropdown category="Clásica" songs={classicalSongs} />
      <Link href="/" className="absolute top-8 left-8 px-4 py-2 text-lg font-bold text-white rounded-lg transition-all duration-300 hover:text-primary">
        { '<' }
      </Link>
    </main>
  );
}