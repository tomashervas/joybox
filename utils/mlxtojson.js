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
  const sorted = [...notes].sort((a, b) => a.midi - b.midi);
  const min = Math.min(...sorted.map(n => n.midi));
  const max = Math.max(...sorted.map(n => n.midi));
  const step = (max - min) / 4;

  return notes.map(note => {
    let col = Math.floor((note.midi - min) / step);
    if (col > 3) col = 3;
    return { ...note, column: col };
  });
}

function limitSimultaneous(notes) {
  const grouped = notes.reduce((acc, n) => {
    acc[n.time] = acc[n.time] || [];
    acc[n.time].push(n);
    return acc;
  }, {});

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

      const part = result["score-partwise"].part?.[0];
      if (!part) return reject("No se encontró ninguna parte en el XML");

      const sound = part.measure?.[0]?.direction?.[0]?.sound?.[0]?.["$"];
      const tempo = parseFloat(sound?.tempo || 60);

      const divisions = parseInt(
        part.measure?.[0]?.attributes?.[0]?.divisions?.[0] || 1
      );

      const msPerBeat = 60000 / tempo; 
      const msPerDivision = msPerBeat / divisions;

      const notes = [];
      let time = 0;

      part.measure.forEach(measure => {
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
            time: time * msPerDivision,
            duration: duration * msPerDivision,
          });

          time += duration;
        });
      });

      resolve(notes);
    });
  });
}

async function main() {
  const inputFile = "fur_elise.xml"; 
  let xml;

    xml = fs.readFileSync(inputFile, "utf8");

  const notes = await parseMusicXML(xml);
  const withColumns = assignColumns(notes);
  const limited = withColumns;

  const OFFSET = 500; // tiempo inicial para primera nota
  const GAP = 100;    // mínimo entre notas no simultáneas

  let lastTime = 0;
  const SAMPLE_MIDI_DATA = limited.map(n => {
    let adjustedTime = n.time + OFFSET;
    if (adjustedTime < lastTime + GAP) adjustedTime = lastTime + GAP;
    lastTime = adjustedTime;
    return [Math.round(adjustedTime), n.column, Math.round(n.duration), n.name];
  });

  const jsonCompact = "[\n" + SAMPLE_MIDI_DATA.map(n => `  ${JSON.stringify(n)}`).join(",\n") + "\n]";
  fs.writeFileSync("fur_elise.json", jsonCompact);

  console.log("✅ Exportado con offset y espacio entre notas");
}

main().catch(console.error);
