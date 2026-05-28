import { SIMPLE_PC_NAMES } from "../data/scales.js";

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
export const NATURAL_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const LATIN = { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };

const ACCIDENTAL_TO_OFFSET = {
  "bb": -2,
  "b": -1,
  "": 0,
  "#": 1,
  "##": 2,
  "x": 2
};

const OFFSET_TO_ACCIDENTAL = {
  "-3": "bbb",
  "-2": "bb",
  "-1": "b",
  "0": "",
  "1": "#",
  "2": "##",
  "3": "###"
};

export function normalizeNoteName(note) {
  return String(note || "")
    .trim()
    .replaceAll("♭", "b")
    .replaceAll("♯", "#")
    .replaceAll("𝄪", "##")
    .replaceAll("𝄫", "bb")
    .replace(/^([a-g])/, (m) => m.toUpperCase());
}

export function prettyNote(note) {
  return normalizeNoteName(note).replaceAll("b", "♭").replaceAll("#", "♯");
}

export function parseNote(note) {
  const normalized = normalizeNoteName(note);
  const match = normalized.match(/^([A-G])([#bx]*|b*)$/);
  if (!match) return null;
  const [, letter, accidentalRaw] = match;
  let accidental = accidentalRaw.replaceAll("x", "##");
  let offset = 0;
  if (accidental.includes("#")) offset = accidental.length;
  if (accidental.includes("b")) offset = -accidental.length;
  if (!Number.isFinite(offset) || Math.abs(offset) > 4) return null;
  const pc = mod(NATURAL_PC[letter] + offset, 12);
  return { letter, accidental, offset, pc, normalized: `${letter}${accidental}` };
}

export function mod(value, base) {
  return ((value % base) + base) % base;
}

function closestAccidental(targetPc, naturalPc) {
  let diff = mod(targetPc - naturalPc, 12);
  if (diff > 6) diff -= 12;
  if (diff < -3 || diff > 3) return null;
  return OFFSET_TO_ACCIDENTAL[String(diff)] ?? null;
}

export function spellScale(root, scale) {
  const rootParsed = parseNote(root);
  if (!rootParsed) throw new Error(`Raíz inválida: ${root}`);
  const rootIndex = LETTERS.indexOf(rootParsed.letter);
  const degreeOffsets = scale.degreeOffsets ?? scale.steps.map((_, index) => index);

  return scale.steps.map((step, index) => {
    const letter = LETTERS[mod(rootIndex + degreeOffsets[index], LETTERS.length)];
    const targetPc = mod(rootParsed.pc + step, 12);
    const naturalPc = NATURAL_PC[letter];
    const accidental = closestAccidental(targetPc, naturalPc);
    if (accidental === null) return SIMPLE_PC_NAMES[targetPc];
    return `${letter}${accidental}`;
  });
}

export function pitchClasses(notes) {
  return notes.map((note) => parseNote(note)?.pc ?? null);
}

export function samePitchSet(a, b) {
  const aSet = new Set(pitchClasses(a).filter((pc) => pc !== null));
  const bSet = new Set(pitchClasses(b).filter((pc) => pc !== null));
  if (aSet.size !== bSet.size) return false;
  for (const pc of aSet) if (!bSet.has(pc)) return false;
  return true;
}

export function sameOrderedPitch(a, b) {
  if (a.length !== b.length) return false;
  return a.every((note, index) => parseNote(note)?.pc === parseNote(b[index])?.pc);
}

export function normalizeNotes(notes) {
  return notes.map((note) => normalizeNoteName(note));
}

export function sameExactNotes(a, b) {
  if (a.length !== b.length) return false;
  const aNorm = normalizeNotes(a);
  const bNorm = normalizeNotes(b);
  return aNorm.every((note, index) => note === bNorm[index]);
}

export function getScaleQualityReport(userNotes, correctNotes, strict = true) {
  const complete = userNotes.length === correctNotes.length && userNotes.every(Boolean);
  if (!complete) {
    return {
      ok: false,
      complete: false,
      exact: false,
      pitch: false,
      message: "Faltan grados por forjar. La escala no se va a completar sola, aunque sería cómodo para todos."
    };
  }

  const exact = sameExactNotes(userNotes, correctNotes);
  const pitch = sameOrderedPitch(userNotes, correctNotes) || samePitchSet(userNotes, correctNotes);

  if (strict && exact) {
    return {
      ok: true,
      complete: true,
      exact,
      pitch,
      message: "Correcto: sonido y escritura funcional coinciden. El Notario Enharmónico no tiene de qué quejarse, desgraciadamente."
    };
  }

  if (strict && pitch && !exact) {
    return {
      ok: false,
      complete: true,
      exact,
      pitch,
      message: "Suena equivalente, pero la escritura no respeta la función de los grados. Enharmonía útil, respuesta incorrecta. Cruel, pero justo."
    };
  }

  if (!strict && pitch) {
    return {
      ok: true,
      complete: true,
      exact,
      pitch,
      message: exact
        ? "Correcto y además escrito con criterio. Qué detalle tan raro y hermoso."
        : "Correcto por sonido. En escalas simétricas aceptamos equivalencia, porque pelearse por cada enharmonía aquí sería deporte extremo."
    };
  }

  return {
    ok: false,
    complete: true,
    exact,
    pitch,
    message: "No coincide ni por escritura ni por sonido. El portal musical cerró la puerta con razón."
  };
}

export function intervalFormulaText(scale) {
  return scale.formula.join(" – ");
}

export function degreesText(scale) {
  return scale.degrees.join(" · ");
}

export function noteToMidi(note, octave = 4) {
  const parsed = parseNote(note);
  if (!parsed) return null;
  return (octave + 1) * 12 + parsed.pc;
}

export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function sortScaleAscending(notes) {
  const midiNotes = [];
  let previous = null;
  for (const note of notes) {
    let midi = noteToMidi(note, 4);
    if (midi === null) continue;
    while (previous !== null && midi <= previous) midi += 12;
    previous = midi;
    midiNotes.push({ note, midi });
  }
  return midiNotes;
}

export function romanDegree(index) {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][index] ?? String(index + 1);
}

export function getChangedDegreeIndexes(sourceNotes, targetNotes) {
  const max = Math.max(sourceNotes.length, targetNotes.length);
  const changed = [];
  for (let i = 0; i < max; i += 1) {
    if (normalizeNoteName(sourceNotes[i]) !== normalizeNoteName(targetNotes[i])) changed.push(i);
  }
  return changed;
}

export function makeChordSymbol(root, chordSuffix) {
  return `${prettyNote(root)}${chordSuffix}`;
}
