export const CHORD_CONTEXTS = [
  {
    chord: "maj7#11",
    scaleId: "lydian",
    description: "Acorde mayor con #11. Pide brillo lidio, no una cuarta natural estorbando como invitado incómodo.",
    roots: ["C", "F", "Bb", "Eb", "G", "D", "A"]
  },
  {
    chord: "7",
    scaleId: "mixolydian",
    description: "Dominante sin alteraciones fuertes. Mixolidio hace el trabajo sin ponerse intenso.",
    roots: ["C", "F", "Bb", "G", "D", "A", "E"]
  },
  {
    chord: "7#11",
    scaleId: "lydian-dominant",
    description: "Dominante con #11. Lidio dominante: tercera mayor, séptima menor y #4.",
    roots: ["C", "F", "Bb", "Eb", "G", "D", "A"]
  },
  {
    chord: "7(b9,b13)",
    scaleId: "phrygian-dominant",
    description: "Dominante de color menor armónico: ♭9 y ♭13 con tercera mayor.",
    roots: ["E", "A", "D", "G", "C", "B", "F#"]
  },
  {
    chord: "7alt",
    scaleId: "altered",
    description: "Dominante alterado: ♭9, #9, ♭5/#11 y #5/♭13. Un pequeño accidente organizado.",
    roots: ["C", "G", "D", "A", "E", "B", "F#", "Bb"]
  },
  {
    chord: "m7b5(9)",
    scaleId: "locrian-natural-2",
    description: "Semidisminuido con 9 natural. Locria ♮2, porque la ♭2 no siempre tiene que meterse en todo.",
    roots: ["B", "E", "A", "D", "G", "C", "F#"]
  },
  {
    chord: "m7b5",
    scaleId: "locrian",
    description: "Semidisminuido clásico: 1, ♭3, ♭5, ♭7 con color locrio.",
    roots: ["B", "E", "A", "D", "G", "C", "F#"]
  },
  {
    chord: "mMaj7",
    scaleId: "melodic-minor",
    description: "Menor con séptima mayor. Menor melódica: el villano elegante de los acordes menores.",
    roots: ["C", "D", "E", "A", "G", "F", "Bb"]
  },
  {
    chord: "m6",
    scaleId: "dorian",
    description: "Menor con sexta mayor y séptima menor. Dórico, el menor que sí salió a caminar.",
    roots: ["D", "G", "C", "F", "A", "E", "Bb"]
  },
  {
    chord: "7(b9)",
    scaleId: "diminished-half-whole",
    description: "Dominante con ♭9 y simetría semitono-tono. Ocho notas para cuando siete no causaban suficiente caos.",
    roots: ["C", "G", "D", "A", "E", "B", "F#", "Bb"]
  },
  {
    chord: "7#5",
    scaleId: "whole-tone",
    description: "Dominante aumentado. Tonos enteros: puro sueño suspendido sin suelo tonal claro.",
    roots: ["C", "G", "D", "A", "E", "Bb", "F"]
  }
];
