import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl md:text-6xl font-bold text-center font-retro text-shadow-(--shadow-neon-primary)">
        Joybox
      </h1>
      <div className="mt-12">
        <Link href="/dropped-tiles">
          <button className="px-8 py-4 text-2xl text-primary rounded-lg shadow-(--shadow-neon-secondary) transition-all duration-300 hover:bg-[--color-primary] hover:shadow-(--shadow-neon-primary)">
            DroppedTiles
          </button>
        </Link>
      </div>
    </main>
  );
}
