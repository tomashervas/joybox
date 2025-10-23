import Link from 'next/link';
import DroppedTilesGame, { MidiDataEntry } from '@/components/dropped-tiles/Game';
import { notFound } from 'next/navigation';

// Función para cargar los datos de la canción de forma dinámica
async function getSongData(slug: string): Promise<MidiDataEntry[] | null> {
  try {
    // La importación dinámica usa una ruta relativa al archivo actual
    const songModule = await import(`@/scores/json/${slug}.json`);
    return songModule.default as MidiDataEntry[];
  } catch (error) {
    console.error(`Error loading song data for slug: ${slug}`, error);
    return null;
  }
}

export default async function GamePage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const songNotes = await getSongData(slug);

  if (!songNotes) {
    notFound(); // Muestra la página 404 si la canción no se encuentra
  }

  return (
    <main className="relative w-screen h-screen bg-gray-900">
      <DroppedTilesGame songNotes={songNotes} />
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