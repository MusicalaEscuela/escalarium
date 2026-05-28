import { CAMPAIGN_ZONES, ZONE_BY_ID } from "./data/campaign.js";
import { buildRun, generateChallenge, gradeChallenge, nextZoneId } from "./core/challenges.js";
import { playFeedback, playScale } from "./core/audio.js";
import { loadState, pushHistory, resetState, saveState } from "./core/storage.js";
import { renderShell } from "./ui/render.js";

const root = document.querySelector("#app");
let state = loadState();
let runtime = {
  screen: state.run ? "play" : "home",
  challenge: state.run ? null : null,
  answer: {},
  feedback: null,
  showHint: false
};

if (state.run) {
  runtime.challenge = generateChallenge(state);
  runtime.answer = defaultAnswer(runtime.challenge);
}

render();
registerServiceWorker();

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  handleAction(action, target);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && runtime.screen === "play" && !runtime.feedback) {
    submitAnswer();
  }
  if (event.key === "Escape" && runtime.screen === "play") {
    runtime.showHint = false;
    render();
  }
});

function handleAction(action, target) {
  switch (action) {
    case "go-home":
      runtime.screen = "home";
      render();
      break;
    case "go-library":
      runtime.screen = "library";
      render();
      break;
    case "go-stats":
      runtime.screen = "stats";
      render();
      break;
    case "start-zone":
      startZone(target.dataset.zone);
      break;
    case "quick-run":
      startZone(state.unlockedZones[state.unlockedZones.length - 1] ?? "tonal");
      break;
    case "set-active-degree":
      runtime.answer.activeDegree = Number(target.dataset.index);
      render();
      break;
    case "pick-note":
      pickNote(target.dataset.note, target.dataset.mode);
      break;
    case "select-audit-index":
      runtime.answer.auditIndex = Number(target.dataset.index);
      render();
      break;
    case "select-option":
      runtime.answer.optionId = target.dataset.option;
      render();
      break;
    case "toggle-mutation-index":
      toggleMutationIndex(Number(target.dataset.index));
      break;
    case "clear-answer":
      if (!runtime.feedback) {
        runtime.answer = defaultAnswer(runtime.challenge);
        render();
      }
      break;
    case "submit-answer":
      submitAnswer();
      break;
    case "next-challenge":
      nextChallenge();
      break;
    case "toggle-hint":
      runtime.showHint = !runtime.showHint;
      render();
      break;
    case "play-correct":
      if (runtime.challenge?.correctNotes) playScale(runtime.challenge.correctNotes, { enabled: state.settings.sound });
      break;
    case "toggle-sound":
      state.settings.sound = !state.settings.sound;
      saveState(state);
      render();
      break;
    case "end-run":
      endRun(false);
      break;
    case "reset-progress":
      if (confirm("¿Reiniciar todo el progreso de Escalarium Pro?")) {
        state = resetState();
        runtime = { screen: "home", challenge: null, answer: {}, feedback: null, showHint: false };
        render();
      }
      break;
    default:
      console.warn("Acción desconocida", action);
  }
}

function startZone(zoneId) {
  if (!state.unlockedZones.includes(zoneId)) return;
  state.run = buildRun(zoneId);
  state.run.bossHp = 1;
  state.run.bossMaxHp = 1;
  runtime.screen = "play";
  runtime.challenge = generateChallenge(state);
  runtime.answer = defaultAnswer(runtime.challenge);
  runtime.feedback = null;
  runtime.showHint = false;
  saveState(state);
  render();
}

function submitAnswer() {
  if (!runtime.challenge || runtime.feedback) return;
  const grade = gradeChallenge(runtime.challenge, runtime.answer);
  runtime.feedback = grade;
  applyGrade(grade);
  playFeedback(grade.ok, state.settings.sound);
  saveState(state);
  render();
}

function applyGrade(grade) {
  const run = state.run;
  const zone = ZONE_BY_ID[run.zoneId];
  const zoneStats = ensureZoneStats(run.zoneId);
  run.answered += 1;
  zoneStats.answered += 1;
  state.profile.totalAnswered += 1;

  if (grade.ok) {
    const streakBonus = run.streak * 15;
    const earned = grade.score + streakBonus;
    run.score += earned;
    run.correct += 1;
    run.streak += 1;
    zoneStats.correct += 1;
    zoneStats.bestStreak = Math.max(zoneStats.bestStreak, run.streak);
    state.profile.totalCorrect += 1;
    state.profile.xp += Math.round(earned / 2);
    state.profile.bestStreak = Math.max(state.profile.bestStreak, run.streak);

    if (runtime.challenge.isBoss) {
      run.bossHp = 0;
      zoneStats.clears += 1;
      unlockNextZone(run.zoneId);
    }
  } else {
    run.lives -= 1;
    run.streak = 0;
  }

  zoneStats.bestScore = Math.max(zoneStats.bestScore, run.score);
  state.profile.rank = getRank(state.profile.xp);
  pushHistory(state, {
    ok: grade.ok,
    title: runtime.challenge.title,
    zoneName: zone.name,
    score: grade.score,
    at: Date.now()
  });
}

function nextChallenge() {
  if (!state.run || state.run.lives <= 0) {
    endRun(false);
    return;
  }

  state.run.round += 1;
  state.run.bossHp = 1;
  state.run.bossMaxHp = 1;
  runtime.challenge = generateChallenge(state);
  runtime.answer = defaultAnswer(runtime.challenge);
  runtime.feedback = null;
  runtime.showHint = false;
  saveState(state);
  render();
}

function endRun(completed) {
  if (state.run) {
    const zoneStats = ensureZoneStats(state.run.zoneId);
    zoneStats.bestScore = Math.max(zoneStats.bestScore, state.run.score);
  }
  state.run = null;
  runtime.screen = "home";
  runtime.challenge = null;
  runtime.answer = {};
  runtime.feedback = null;
  runtime.showHint = false;
  saveState(state);
  render();
}

function unlockNextZone(zoneId) {
  const next = nextZoneId(zoneId);
  if (next && !state.unlockedZones.includes(next)) {
    state.unlockedZones.push(next);
    state.unlockedZones.sort((a, b) => CAMPAIGN_ZONES.find((z) => z.id === a).order - CAMPAIGN_ZONES.find((z) => z.id === b).order);
  }
}

function ensureZoneStats(zoneId) {
  state.zoneStats[zoneId] = state.zoneStats[zoneId] ?? {
    clears: 0,
    bestScore: 0,
    bestStreak: 0,
    correct: 0,
    answered: 0
  };
  return state.zoneStats[zoneId];
}

function pickNote(note, mode) {
  if (runtime.feedback) return;
  if (mode === "repair") {
    runtime.answer.repairNote = note;
    render();
    return;
  }

  const challenge = runtime.challenge;
  if (!challenge || challenge.type !== "forge") return;
  const notes = runtime.answer.notes ?? Array(challenge.correctNotes.length).fill("");
  const active = Number.isFinite(runtime.answer.activeDegree) ? runtime.answer.activeDegree : 0;
  notes[active] = note;
  runtime.answer.notes = notes;
  const nextEmpty = notes.findIndex((value, index) => !value && index > active);
  runtime.answer.activeDegree = nextEmpty >= 0 ? nextEmpty : Math.min(active + 1, notes.length - 1);
  render();
}

function toggleMutationIndex(index) {
  if (runtime.feedback) return;
  const selected = new Set(runtime.answer.changedIndexes ?? []);
  if (selected.has(index)) selected.delete(index);
  else selected.add(index);
  runtime.answer.changedIndexes = [...selected].sort((a, b) => a - b);
  render();
}

function defaultAnswer(challenge) {
  if (!challenge) return {};
  if (challenge.type === "forge") {
    return { notes: Array(challenge.correctNotes.length).fill(""), activeDegree: 0 };
  }
  if (challenge.type === "audit") {
    return { auditIndex: null, repairNote: "" };
  }
  if (challenge.type === "mutation") {
    return { changedIndexes: [] };
  }
  return { optionId: "" };
}

function getRank(xp) {
  if (xp >= 5000) return "Arquitecto/a del Abismo";
  if (xp >= 3000) return "Maestro/a Enharmónico/a";
  if (xp >= 1800) return "Forjador/a Modal";
  if (xp >= 900) return "Custodio/a Tonal";
  if (xp >= 300) return "Aprendiz de la Forja";
  return "Aspirante Escalarium";
}

function render() {
  root.innerHTML = renderShell(state, runtime);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((error) => {
        console.warn("No se pudo registrar el service worker", error);
      });
    });
  }
}
