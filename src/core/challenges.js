import { SCALE_TYPES, SCALE_BY_ID, ROOTS_BY_LEVEL } from "../data/scales.js";
import { CAMPAIGN_ZONES, GAME_RULES, ZONE_BY_ID } from "../data/campaign.js";
import { CHORD_CONTEXTS } from "../data/chords.js";
import {
  degreesText,
  getChangedDegreeIndexes,
  getScaleQualityReport,
  intervalFormulaText,
  makeChordSymbol,
  prettyNote,
  spellScale
} from "./theory.js";

const SCORE_BY_TYPE = {
  forge: 100,
  audit: 120,
  formula: 80,
  mutation: 130,
  identify: 100,
  chord: 150
};

export function getAvailableScalesForZone(zoneId) {
  return SCALE_TYPES.filter((scale) => scale.zones.includes(zoneId));
}

export function getZoneProgress(state, zoneId) {
  return state.zoneStats?.[zoneId] ?? {
    clears: 0,
    bestScore: 0,
    bestStreak: 0,
    correct: 0,
    answered: 0
  };
}

export function nextZoneId(zoneId) {
  const current = CAMPAIGN_ZONES.find((zone) => zone.id === zoneId);
  return CAMPAIGN_ZONES.find((zone) => zone.order === current.order + 1)?.id ?? null;
}

export function buildRun(zoneId) {
  return {
    zoneId,
    round: 1,
    lives: GAME_RULES.lives,
    score: 0,
    streak: 0,
    bossHp: 3,
    answered: 0,
    correct: 0,
    startedAt: Date.now()
  };
}

export function generateChallenge(state) {
  const run = state.run;
  const zone = ZONE_BY_ID[run.zoneId];
  const isBoss = run.round % GAME_RULES.roundsPerBoss === 0;
  const type = isBoss ? chooseBossType(zone) : choose(zone.challengeMix);
  const scalePool = getAvailableScalesForZone(zone.id);
  const challenge = buildChallengeByType(type, zone, scalePool, run.round);
  challenge.isBoss = isBoss;
  challenge.zoneId = zone.id;
  challenge.round = run.round;
  if (isBoss) {
    challenge.boss = zone.boss;
    challenge.title = `${zone.boss.name}: ${challenge.title}`;
  }
  return challenge;
}

function chooseBossType(zone) {
  if (zone.id === "dominants") return choose(["chord", "audit", "forge"]);
  if (zone.id === "symmetry") return choose(["formula", "forge", "chord"]);
  if (zone.id === "modes") return choose(["identify", "mutation", "audit"]);
  return choose(["forge", "audit", "mutation"]);
}

function buildChallengeByType(type, zone, scalePool, round) {
  switch (type) {
    case "audit":
      return makeAuditChallenge(zone, scalePool, round);
    case "formula":
      return makeFormulaChallenge(zone, scalePool, round);
    case "mutation":
      return makeMutationChallenge(zone, scalePool, round);
    case "identify":
      return makeIdentifyChallenge(zone, scalePool, round);
    case "chord":
      return makeChordChallenge(zone, round);
    case "forge":
    default:
      return makeForgeChallenge(zone, scalePool, round);
  }
}

function makeForgeChallenge(zone, scalePool, round) {
  const scale = chooseWeightedScale(scalePool, round);
  const root = chooseRoot(zone.id, scale);
  const correctNotes = spellScale(root, scale);
  return {
    id: cryptoId(),
    type: "forge",
    title: "Forja de grados",
    prompt: `Construye ${prettyNote(root)} ${scale.name}.`,
    instruction: "Llena cada grado con la nota correcta. En escalas estrictas, la ortografía importa más que el ego.",
    root,
    scaleId: scale.id,
    correctNotes,
    options: null,
    meta: makeScaleMeta(scale)
  };
}

function makeAuditChallenge(zone, scalePool, round) {
  const scale = chooseWeightedScale(scalePool, round);
  const root = chooseRoot(zone.id, scale);
  const correctNotes = spellScale(root, scale);
  const corrupted = [...correctNotes];
  const index = randomInt(0, corrupted.length - 1);
  corrupted[index] = makeCorruptNote(corrupted[index], correctNotes, index);
  return {
    id: cryptoId(),
    type: "audit",
    title: "Auditoría enharmónica",
    prompt: `Una nota de ${prettyNote(root)} ${scale.name} fue saboteada. Encuentra el grado y repáralo.`,
    instruction: "Selecciona el chip incorrecto y elige la nota que debería ir ahí.",
    root,
    scaleId: scale.id,
    correctNotes,
    corruptedNotes: corrupted,
    corruptIndexes: [index],
    meta: makeScaleMeta(scale)
  };
}

function makeFormulaChallenge(zone, scalePool, round) {
  const scale = chooseWeightedScale(scalePool, round);
  const distractors = SCALE_TYPES
    .filter((item) => item.id !== scale.id && item.steps.length === scale.steps.length)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((item) => ({ id: item.id, label: intervalFormulaText(item), sub: item.short }));
  const options = shuffle([
    { id: scale.id, label: intervalFormulaText(scale), sub: scale.short, correct: true },
    ...distractors
  ]);
  return {
    id: cryptoId(),
    type: "formula",
    title: "Código interválico",
    prompt: `El portal pide la fórmula de ${scale.name}.`,
    instruction: "Elige la secuencia de intervalos correcta.",
    root: null,
    scaleId: scale.id,
    correctNotes: null,
    options,
    meta: makeScaleMeta(scale)
  };
}

function makeMutationChallenge(zone, scalePool, round) {
  const candidates = scalePool.filter((scale) => scale.steps.length === 7 && scale.strict);
  const source = choose(candidates.length ? candidates : SCALE_TYPES.filter((scale) => scale.steps.length === 7 && scale.strict));
  const targetPool = SCALE_TYPES.filter((scale) => scale.id !== source.id && scale.steps.length === 7 && scale.strict && scale.zones.some((z) => z === zone.id));
  const target = choose(targetPool.length ? targetPool : SCALE_TYPES.filter((scale) => scale.id !== source.id && scale.steps.length === 7 && scale.strict));
  const root = chooseRoot(zone.id, target);
  const sourceNotes = spellScale(root, source);
  const targetNotes = spellScale(root, target);
  const changed = getChangedDegreeIndexes(sourceNotes, targetNotes);
  return {
    id: cryptoId(),
    type: "mutation",
    title: "Mutación modal",
    prompt: `Convierte ${prettyNote(root)} ${source.name} en ${prettyNote(root)} ${target.name}.`,
    instruction: "Marca solo los grados que deben cambiar. No cambies por cambiar, eso ya lo hacen las apps mal planeadas.",
    root,
    scaleId: target.id,
    sourceScaleId: source.id,
    sourceNotes,
    correctNotes: targetNotes,
    changedIndexes: changed,
    meta: {
      target: makeScaleMeta(target),
      source: makeScaleMeta(source)
    }
  };
}

function makeIdentifyChallenge(zone, scalePool, round) {
  const scale = chooseWeightedScale(scalePool.filter((item) => item.steps.length === 7), round);
  const root = chooseRoot(zone.id, scale);
  const correctNotes = spellScale(root, scale);
  const distractors = SCALE_TYPES
    .filter((item) => item.id !== scale.id && item.steps.length === scale.steps.length)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
    .map((item) => ({ id: item.id, label: item.name, sub: item.family }));
  const options = shuffle([
    { id: scale.id, label: scale.name, sub: scale.family, correct: true },
    ...distractors
  ]);
  return {
    id: cryptoId(),
    type: "identify",
    title: "Centro oculto",
    prompt: `Identifica la escala si ${prettyNote(root)} es el centro: ${correctNotes.map(prettyNote).join(" · ")}`,
    instruction: "No te vayas por la relativa mayor como si fuera reflejo condicionado. El centro manda.",
    root,
    scaleId: scale.id,
    correctNotes,
    options,
    meta: makeScaleMeta(scale)
  };
}

function makeChordChallenge(zone, round) {
  const pool = CHORD_CONTEXTS.filter((context) => {
    const scale = SCALE_BY_ID[context.scaleId];
    return scale?.zones.includes(zone.id) || zone.id === "dominants";
  });
  const context = choose(pool.length ? pool : CHORD_CONTEXTS);
  const scale = SCALE_BY_ID[context.scaleId];
  const root = choose(context.roots);
  const correctNotes = spellScale(root, scale);
  const distractors = SCALE_TYPES
    .filter((item) => item.id !== scale.id && (item.zones.includes(zone.id) || item.family.includes("Dominantes") || item.steps.length === scale.steps.length))
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map((item) => ({ id: item.id, label: item.name, sub: item.family }));
  const options = shuffle([
    { id: scale.id, label: scale.name, sub: "Respuesta funcional", correct: true },
    ...distractors
  ]).slice(0, 6);
  return {
    id: cryptoId(),
    type: "chord",
    title: "Escala contra acorde",
    prompt: `Contexto: ${makeChordSymbol(root, context.chord)}. ¿Qué escala funciona mejor?`,
    instruction: context.description,
    root,
    chord: context.chord,
    scaleId: scale.id,
    correctNotes,
    options,
    meta: makeScaleMeta(scale)
  };
}

export function gradeChallenge(challenge, answer) {
  const scale = SCALE_BY_ID[challenge.scaleId];
  switch (challenge.type) {
    case "forge": {
      const report = getScaleQualityReport(answer.notes ?? [], challenge.correctNotes, scale.strict);
      return buildGrade(report.ok, report.message, challenge, { exact: report.exact, pitch: report.pitch });
    }
    case "audit": {
      const selectedIndex = answer.auditIndex;
      const repairNote = answer.repairNote;
      const correctIndex = challenge.corruptIndexes[0];
      const indexOk = Number(selectedIndex) === correctIndex;
      const repairReport = getScaleQualityReport(
        challenge.corruptedNotes.map((note, index) => (index === correctIndex ? repairNote : note)),
        challenge.correctNotes,
        scale.strict
      );
      const ok = indexOk && repairReport.ok;
      const message = ok
        ? "Auditoría superada. Detectaste el sabotaje y reparaste la escritura. Qué descanso tan raro."
        : !indexOk
          ? `Ese no era el grado corrupto. El problema estaba en el grado ${correctIndex + 1}.`
          : repairReport.message;
      return buildGrade(ok, message, challenge, { selectedIndex, correctIndex });
    }
    case "formula": {
      const ok = answer.optionId === challenge.scaleId;
      const message = ok
        ? "Código correcto. La fórmula abrió el portal sin ponerse dramática."
        : `No. La fórmula correcta de ${scale.name} es ${intervalFormulaText(scale)}.`;
      return buildGrade(ok, message, challenge);
    }
    case "identify":
    case "chord": {
      const ok = answer.optionId === challenge.scaleId;
      const message = ok
        ? "Lectura funcional correcta. Esto ya huele a músico que no depende solo de memorizar listas."
        : `No. La respuesta era ${scale.name}.`;
      return buildGrade(ok, message, challenge);
    }
    case "mutation": {
      const expected = new Set(challenge.changedIndexes);
      const selected = new Set(answer.changedIndexes ?? []);
      const ok = expected.size === selected.size && [...expected].every((index) => selected.has(index));
      const degrees = challenge.changedIndexes.map((index) => index + 1).join(", ");
      const message = ok
        ? "Mutación limpia. Cambiaste exactamente lo necesario, que ya es más criterio que el promedio de comité humano."
        : `No. Debían cambiar los grados ${degrees || "ninguno"}.`;
      return buildGrade(ok, message, challenge);
    }
    default:
      return buildGrade(false, "Tipo de reto desconocido. El juego se confundió, qué humano de su parte.", challenge);
  }
}

function buildGrade(ok, message, challenge, extra = {}) {
  const base = SCORE_BY_TYPE[challenge.type] ?? 100;
  const score = ok ? base * (challenge.isBoss ? 2 : 1) : 0;
  return {
    ok,
    message,
    score,
    correctNotes: challenge.correctNotes,
    scale: SCALE_BY_ID[challenge.scaleId],
    ...extra
  };
}

function makeScaleMeta(scale) {
  return {
    name: scale.name,
    family: scale.family,
    formula: intervalFormulaText(scale),
    degrees: degreesText(scale),
    strict: scale.strict,
    hint: scale.hint,
    chordUse: scale.chordUse?.join(" · ") ?? ""
  };
}

function chooseWeightedScale(pool, round = 1) {
  const filtered = pool.length ? pool : SCALE_TYPES;
  const maxDifficulty = Math.min(5, Math.max(1, Math.ceil(round / 2) + 1));
  const candidates = filtered.filter((scale) => scale.difficulty <= maxDifficulty + 1);
  return choose(candidates.length ? candidates : filtered);
}

function chooseRoot(zoneId, scale) {
  if (zoneId === "tonal") return choose(ROOTS_BY_LEVEL.friendly);
  if (zoneId === "modes") return choose(ROOTS_BY_LEVEL.advanced);
  if (zoneId === "dominants") return choose(ROOTS_BY_LEVEL.advanced);
  if (zoneId === "symmetry") return choose(ROOTS_BY_LEVEL.chaos);
  return choose(ROOTS_BY_LEVEL.advanced);
}

function makeCorruptNote(note, correctNotes, index) {
  const prettierAlternatives = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"];
  const correct = correctNotes[index];
  const candidates = prettierAlternatives.filter((candidate) => candidate !== correct && !correctNotes.includes(candidate));
  return choose(candidates.length ? candidates : prettierAlternatives.filter((candidate) => candidate !== correct));
}

function choose(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function cryptoId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
