import fs from "fs";
import xml2js from "xml2js";

const NOTE_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteToMidi(noteName) {
  const match = noteName.match(/^([A-G]#?)(\d)$/);
  if (!match) return null;
  const [, note, octave] = match;
  return NOTE_ORDER.indexOf(note) + (parseInt(octave) + 1) * 12;
}

function assignColumns(notes) {
  // Ordenamos por pitch
  const sorted = [...notes].sort((a, b) => a.midi - b.midi);
  const range = sorted.map(n => n.midi);
  const min = Math.min(...range);
  const max = Math.max(...range);
  const step = (max - min) / 4;

  return notes.map(note => {
    let col = Math.floor((note.midi - min) / step);
    if (col > 3) col = 3;
    return { ...note, column: col };
  });
}

function limitSimultaneous(notes) {
  // Agrupar por "time"
  const grouped = notes.reduce((acc, n) => {
    acc[n.time] = acc[n.time] || [];
    acc[n.time].push(n);
    return acc;
  }, {});

  // Si hay más de 2 notas simultáneas, quedarnos con las más graves
  const filtered = [];
  Object.values(grouped).forEach(group => {
    const selected = group
      .sort((a, b) => a.midi - b.midi)
      .slice(0, 2);
    filtered.push(...selected);
  });

  return filtered.sort((a, b) => a.time - b.time);
}

function parseMusicXML(xmlString) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xmlString, (err, result) => {
      if (err) return reject(err);

      const divisions = parseInt(result["score-partwise"].part[0].measure[0].attributes?.[0]?.divisions?.[0] || 1);
      const notes = [];
      let time = 0;

      result["score-partwise"].part[0].measure.forEach(measure => {
        measure.note?.forEach(n => {
          if (n.rest) return;
          const step = n.pitch?.[0]?.step?.[0];
          const octave = n.pitch?.[0]?.octave?.[0];
          const alter = n.pitch?.[0]?.alter?.[0];
          const duration = parseInt(n.duration?.[0] || 1);
          const noteName = step + (alter ? "#" : "") + octave;
          const midi = noteToMidi(noteName);

          notes.push({
            name: noteName,
            midi,
            time: time * 100, // Escalamos el tiempo (ajústalo)
            duration: duration * 100, // Escalamos duración
          });

          time += duration;
        });
      });

      resolve(notes);
    });
  });
}

async function main() {
  const xml = fs.readFileSync("fur_elise.xml", "utf8");
  const notes = await parseMusicXML(xml);

  const withColumns = assignColumns(notes);
  const limited = limitSimultaneous(withColumns);

  const SAMPLE_MIDI_DATA = limited.map(n => [n.time, n.column, n.duration, n.name]);

  const jsonCompact = "[\n" + SAMPLE_MIDI_DATA.map(n => `  ${JSON.stringify(n)}`).join(",\n") + "\n]";
  
  fs.writeFileSync("fur_elise.json", jsonCompact);
  
  console.log("✅ Exportado");
}

main().catch(console.error);
