const STORAGE_KEY = "escalarium-forja-musicala-v2";

export function defaultState() {
  return {
    profile: {
      name: "Maestro/a",
      rank: "Aprendiz de la Forja",
      xp: 0,
      bestStreak: 0,
      totalCorrect: 0,
      totalAnswered: 0
    },
    unlockedZones: ["tonal"],
    zoneStats: {},
    settings: {
      sound: true,
      strictMode: true,
      reducedMotion: false
    },
    run: null,
    history: []
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return mergeState(defaultState(), parsed);
  } catch (error) {
    console.warn("No se pudo cargar el progreso", error);
    return defaultState();
  }
}

export function saveState(state) {
  const clone = JSON.parse(JSON.stringify(state));
  clone.currentChallenge = null;
  clone.feedback = null;
  clone.answer = null;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return defaultState();
}

function mergeState(base, patch) {
  if (!patch || typeof patch !== "object") return base;
  const result = { ...base, ...patch };
  result.profile = { ...base.profile, ...(patch.profile ?? {}) };
  result.settings = { ...base.settings, ...(patch.settings ?? {}) };
  result.zoneStats = { ...base.zoneStats, ...(patch.zoneStats ?? {}) };
  result.unlockedZones = Array.isArray(patch.unlockedZones) ? patch.unlockedZones : base.unlockedZones;
  result.history = Array.isArray(patch.history) ? patch.history : base.history;
  return result;
}

export function pushHistory(state, entry) {
  state.history = [entry, ...(state.history ?? [])].slice(0, 40);
}
