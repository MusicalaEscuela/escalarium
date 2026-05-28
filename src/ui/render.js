import { NOTE_BANK, SCALE_TYPES } from "../data/scales.js";
import { CAMPAIGN_ZONES, GAME_RULES } from "../data/campaign.js";
import { getZoneProgress } from "../core/challenges.js";
import { prettyNote, romanDegree } from "../core/theory.js";

export function renderShell(state, runtime) {
  const total = Math.max(1, state.profile.totalAnswered);
  const accuracy = Math.round((state.profile.totalCorrect / total) * 100);
  return `
    <header class="topbar">
      <button class="brand" data-action="go-home" aria-label="Volver al inicio">
        <span class="brand-mark">𝄞</span>
        <span>
          <strong>Escalarium Pro</strong>
          <small>La Forja de Escalas · Musicala</small>
        </span>
      </button>
      <nav class="top-actions" aria-label="Navegación principal">
        <button class="ghost-btn ${runtime.screen === "home" ? "active" : ""}" data-action="go-home">Campaña</button>
        <button class="ghost-btn ${runtime.screen === "library" ? "active" : ""}" data-action="go-library">Atlas</button>
        <button class="ghost-btn ${runtime.screen === "stats" ? "active" : ""}" data-action="go-stats">Progreso</button>
        <button class="icon-btn" data-action="toggle-sound" title="Sonido">${state.settings.sound ? "🔊" : "🔇"}</button>
      </nav>
      <section class="profile-pill" aria-label="Perfil">
        <span>${state.profile.rank}</span>
        <strong>${state.profile.xp} XP</strong>
        <small>${accuracy}% precisión</small>
      </section>
    </header>
    <main id="view" class="view ${runtime.screen}">
      ${renderScreen(state, runtime)}
    </main>
  `;
}

function renderScreen(state, runtime) {
  if (runtime.screen === "play") return renderPlay(state, runtime);
  if (runtime.screen === "library") return renderLibrary();
  if (runtime.screen === "stats") return renderStats(state);
  return renderHome(state);
}

export function renderHome(state) {
  const unlocked = new Set(state.unlockedZones);
  return `
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">Juego avanzado de teoría musical</p>
        <h1>Forja escalas, derrota errores y sobrevive a la ortografía enharmónica.</h1>
        <p>Una campaña de retos para músicos que ya saben que <strong>sonar igual</strong> no siempre significa <strong>estar escrito bien</strong>. Por fin una app de escalas que no parece tarea de recuperación.</p>
        <div class="hero-actions">
          <button class="primary-btn" data-action="start-zone" data-zone="${state.unlockedZones[state.unlockedZones.length - 1] ?? "tonal"}">Continuar campaña</button>
          <button class="secondary-btn" data-action="quick-run">Reto relámpago</button>
        </div>
      </div>
      <div class="tower-card" aria-hidden="true">
        <div class="tower-glow"></div>
        <div class="tower-lines">
          ${CAMPAIGN_ZONES.map((zone) => `<span class="tower-node ${unlocked.has(zone.id) ? "unlocked" : "locked"}">${zone.icon}</span>`).join("")}
        </div>
        <strong>La Torre Escalarium</strong>
        <small>5 zonas · boss fights · modos expertos</small>
      </div>
    </section>

    <section class="zone-grid" aria-label="Zonas de campaña">
      ${CAMPAIGN_ZONES.map((zone) => renderZoneCard(zone, state)).join("")}
    </section>
  `;
}

function renderZoneCard(zone, state) {
  const unlocked = state.unlockedZones.includes(zone.id);
  const progress = getZoneProgress(state, zone.id);
  const ratio = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
  return `
    <article class="zone-card ${unlocked ? "" : "locked"}">
      <div class="zone-orb">${zone.icon}</div>
      <div class="zone-body">
        <p class="eyebrow">Zona ${zone.order} · ${zone.mood}</p>
        <h2>${zone.name}</h2>
        <h3>${zone.subtitle}</h3>
        <p>${zone.description}</p>
        <div class="zone-meta">
          <span>Mejor: ${progress.bestScore ?? 0}</span>
          <span>Precisión: ${ratio}%</span>
          <span>Clears: ${progress.clears ?? 0}</span>
        </div>
      </div>
      <div class="zone-actions">
        <button class="${unlocked ? "primary-btn" : "locked-btn"}" data-action="start-zone" data-zone="${zone.id}" ${unlocked ? "" : "disabled"}>
          ${unlocked ? "Entrar" : "Bloqueado"}
        </button>
        <small>${unlocked ? zone.boss.name : zone.unlockText}</small>
      </div>
    </article>
  `;
}

export function renderPlay(state, runtime) {
  const challenge = runtime.challenge;
  const run = state.run;
  if (!challenge || !run) return `<section class="empty-state"><h2>No hay reto activo</h2><button class="primary-btn" data-action="go-home">Volver</button></section>`;
  const answered = Boolean(runtime.feedback);
  const bossClass = challenge.isBoss ? "boss-mode" : "";

  return `
    <section class="game-layout ${bossClass}">
      <aside class="run-panel">
        <div class="run-title">
          <span class="zone-mini">${challenge.isBoss ? "👹 Boss" : "⚔️ Reto"}</span>
          <strong>Ronda ${run.round}</strong>
          <small>${challenge.isBoss ? challenge.boss.title : "Campaña activa"}</small>
        </div>
        <div class="stat-stack">
          ${renderMeter("Vidas", run.lives, GAME_RULES.lives, "♥")}
          ${renderMeter("Boss HP", challenge.isBoss ? run.bossHp : 0, run.bossMaxHp ?? 1, "◆", !challenge.isBoss)}
        </div>
        <div class="score-board">
          <div><span>Puntaje</span><strong>${run.score}</strong></div>
          <div><span>Racha</span><strong>${run.streak}</strong></div>
          <div><span>Correctas</span><strong>${run.correct}/${run.answered}</strong></div>
        </div>
        <button class="secondary-btn full" data-action="end-run">Salir de la torre</button>
      </aside>

      <section class="challenge-card ${answered ? "answered" : ""}">
        ${challenge.isBoss ? `<div class="boss-banner"><span>${challenge.boss.name}</span><p>${challenge.boss.taunt}</p></div>` : ""}
        <div class="challenge-header">
          <div>
            <p class="eyebrow">${challenge.typeLabel ?? challenge.type}</p>
            <h1>${challenge.title}</h1>
          </div>
          <div class="challenge-actions-mini">
            <button class="icon-btn" data-action="play-correct" title="Escuchar referencia">▶</button>
            <button class="icon-btn" data-action="toggle-hint" title="Pista">?</button>
          </div>
        </div>
        <p class="challenge-prompt">${challenge.prompt}</p>
        <p class="challenge-instruction">${challenge.instruction}</p>
        ${runtime.showHint ? renderHint(challenge) : ""}
        ${renderChallengeBody(challenge, runtime)}
        ${renderFeedback(runtime)}
        <div class="challenge-footer">
          ${answered
            ? `<button class="primary-btn" data-action="next-challenge">${run.lives <= 0 ? "Volver a campaña" : "Siguiente reto"}</button>`
            : `<button class="primary-btn" data-action="submit-answer">Comprobar</button>`}
          <button class="secondary-btn" data-action="clear-answer" ${answered ? "disabled" : ""}>Limpiar</button>
        </div>
      </section>

      <aside class="theory-panel">
        <h2>Lectura del reto</h2>
        ${renderTheoryPanel(challenge)}
      </aside>
    </section>
  `;
}

function renderChallengeBody(challenge, runtime) {
  switch (challenge.type) {
    case "forge":
      return renderForge(challenge, runtime);
    case "audit":
      return renderAudit(challenge, runtime);
    case "formula":
    case "identify":
    case "chord":
      return renderOptions(challenge, runtime);
    case "mutation":
      return renderMutation(challenge, runtime);
    default:
      return `<div class="empty-state">Reto desconocido.</div>`;
  }
}

function renderForge(challenge, runtime) {
  const answerNotes = runtime.answer.notes ?? Array(challenge.correctNotes.length).fill("");
  return `
    <div class="degree-forge">
      ${challenge.correctNotes.map((_, index) => `
        <button class="degree-slot ${runtime.answer.activeDegree === index ? "active" : ""} ${answerNotes[index] ? "filled" : ""}" data-action="set-active-degree" data-index="${index}">
          <span>${romanDegree(index)}</span>
          <strong>${answerNotes[index] ? prettyNote(answerNotes[index]) : "—"}</strong>
          <small>${challenge.meta.degrees.split(" · ")[index] ?? ""}</small>
        </button>
      `).join("")}
    </div>
    ${renderNoteBank(runtime)}
  `;
}

function renderAudit(challenge, runtime) {
  return `
    <div class="audit-strip">
      ${challenge.corruptedNotes.map((note, index) => `
        <button class="note-chip ${Number(runtime.answer.auditIndex) === index ? "selected" : ""}" data-action="select-audit-index" data-index="${index}">
          <span>${romanDegree(index)}</span>
          <strong>${prettyNote(note)}</strong>
        </button>
      `).join("")}
    </div>
    <div class="repair-box">
      <span>Reemplazo elegido:</span>
      <strong>${runtime.answer.repairNote ? prettyNote(runtime.answer.repairNote) : "—"}</strong>
    </div>
    ${renderNoteBank(runtime, "repair")}
  `;
}

function renderOptions(challenge, runtime) {
  return `
    <div class="option-grid">
      ${challenge.options.map((option) => `
        <button class="option-card ${runtime.answer.optionId === option.id ? "selected" : ""}" data-action="select-option" data-option="${option.id}">
          <strong>${option.label}</strong>
          <small>${option.sub ?? ""}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function renderMutation(challenge, runtime) {
  const selected = new Set(runtime.answer.changedIndexes ?? []);
  return `
    <div class="mutation-board">
      <div class="scale-row">
        <span>${challenge.meta.source.name}</span>
        ${challenge.sourceNotes.map((note, index) => `<button class="note-chip static" data-action="toggle-mutation-index" data-index="${index}"><small>${romanDegree(index)}</small><strong>${prettyNote(note)}</strong></button>`).join("")}
      </div>
      <div class="mutation-arrow">↓ marca los grados que cambian ↓</div>
      <div class="scale-row selectable">
        <span>${challenge.meta.target.name}</span>
        ${challenge.sourceNotes.map((note, index) => `
          <button class="note-chip ${selected.has(index) ? "selected" : ""}" data-action="toggle-mutation-index" data-index="${index}">
            <small>${romanDegree(index)}</small><strong>${selected.has(index) ? "Cambiar" : "Igual"}</strong>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderNoteBank(runtime, mode = "forge") {
  const groups = [];
  for (let i = 0; i < NOTE_BANK.length; i += 5) groups.push(NOTE_BANK.slice(i, i + 5));
  return `
    <div class="note-bank" aria-label="Banco de notas">
      ${groups.map((group) => `
        <div class="note-family">
          ${group.map((note) => `
            <button class="note-key" data-action="pick-note" data-note="${note}" data-mode="${mode}">${prettyNote(note)}</button>
          `).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function renderTheoryPanel(challenge) {
  const meta = challenge.meta?.target ?? challenge.meta;
  return `
    <div class="theory-card">
      <span>Familia</span>
      <strong>${meta.family ?? "—"}</strong>
    </div>
    <div class="theory-card">
      <span>Fórmula</span>
      <strong>${meta.formula ?? "—"}</strong>
    </div>
    <div class="theory-card">
      <span>Grados</span>
      <strong>${meta.degrees ?? "—"}</strong>
    </div>
    <div class="theory-card">
      <span>Uso armónico</span>
      <strong>${meta.chordUse || "Contextual"}</strong>
    </div>
    <div class="chromatic-ring" aria-hidden="true">
      ${["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"].map((note, index) => `<span style="--i:${index}">${note}</span>`).join("")}
    </div>
  `;
}

function renderHint(challenge) {
  const meta = challenge.meta?.target ?? challenge.meta;
  return `
    <aside class="hint-box">
      <strong>Pista</strong>
      <p>${meta.hint ?? "Mira la fórmula y el uso armónico. Sí, leer ayuda, qué plot twist."}</p>
    </aside>
  `;
}

function renderFeedback(runtime) {
  if (!runtime.feedback) return "";
  const feedback = runtime.feedback;
  return `
    <section class="feedback ${feedback.ok ? "ok" : "bad"}">
      <div>
        <strong>${feedback.ok ? "Reto superado" : "Reto fallido"}</strong>
        <p>${feedback.message}</p>
      </div>
      ${feedback.correctNotes ? `<div class="correct-line"><span>Respuesta:</span> ${feedback.correctNotes.map(prettyNote).join(" · ")}</div>` : ""}
      ${feedback.scale ? `<div class="correct-line"><span>Escala:</span> ${feedback.scale.name} · ${feedback.scale.degrees.join(" · ")}</div>` : ""}
    </section>
  `;
}

function renderMeter(label, value, max, symbol, hidden = false) {
  if (hidden) return "";
  const count = Array.from({ length: max }, (_, index) => `<span class="${index < value ? "on" : "off"}">${symbol}</span>`).join("");
  return `<div class="meter"><small>${label}</small><div>${count}</div></div>`;
}

export function renderLibrary() {
  const groups = groupBy(SCALE_TYPES, "family");
  return `
    <section class="page-head">
      <p class="eyebrow">Atlas de escalas</p>
      <h1>Biblioteca de fórmulas, grados y usos</h1>
      <p>Referencia rápida para estudiar después de que el juego te humille con cariño pedagógico.</p>
    </section>
    <section class="library-grid">
      ${Object.entries(groups).map(([family, scales]) => `
        <article class="library-group">
          <h2>${family}</h2>
          ${scales.map((scale) => `
            <details class="scale-detail">
              <summary><strong>${scale.name}</strong><span>${scale.degrees.join(" · ")}</span></summary>
              <p>${scale.hint}</p>
              <div class="detail-grid">
                <span>Fórmula: <strong>${scale.formula.join(" – ")}</strong></span>
                <span>Uso: <strong>${scale.chordUse?.join(" · ") ?? "Contextual"}</strong></span>
                <span>Escritura: <strong>${scale.strict ? "estricta" : "flexible por simetría"}</strong></span>
              </div>
            </details>
          `).join("")}
        </article>
      `).join("")}
    </section>
  `;
}

export function renderStats(state) {
  const total = Math.max(1, state.profile.totalAnswered);
  const accuracy = Math.round((state.profile.totalCorrect / total) * 100);
  return `
    <section class="page-head">
      <p class="eyebrow">Progreso</p>
      <h1>Historial de la forja</h1>
      <p>${state.profile.totalCorrect}/${state.profile.totalAnswered} respuestas correctas · ${accuracy}% precisión · mejor racha ${state.profile.bestStreak}</p>
      <div class="hero-actions">
        <button class="secondary-btn" data-action="reset-progress">Reiniciar progreso</button>
      </div>
    </section>
    <section class="stats-grid">
      ${CAMPAIGN_ZONES.map((zone) => {
        const progress = getZoneProgress(state, zone.id);
        const zoneTotal = Math.max(1, progress.answered ?? 0);
        const zoneAcc = Math.round(((progress.correct ?? 0) / zoneTotal) * 100);
        return `
          <article class="stat-card">
            <span>${zone.icon}</span>
            <h2>${zone.name}</h2>
            <p>Mejor puntaje: <strong>${progress.bestScore ?? 0}</strong></p>
            <p>Precisión: <strong>${zoneAcc}%</strong></p>
            <p>Clears: <strong>${progress.clears ?? 0}</strong></p>
          </article>
        `;
      }).join("")}
    </section>
    <section class="history-list">
      <h2>Últimos retos</h2>
      ${(state.history ?? []).length ? state.history.map((item) => `
        <article class="history-item ${item.ok ? "ok" : "bad"}">
          <strong>${item.ok ? "✓" : "×"} ${item.title}</strong>
          <span>${item.zoneName} · ${item.score} pts</span>
        </article>
      `).join("") : `<p class="empty-state">Todavía no hay historial. Qué paz tan sospechosa.</p>`}
    </section>
  `;
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const group = item[key] ?? "Otros";
    acc[group] = acc[group] ?? [];
    acc[group].push(item);
    return acc;
  }, {});
}
