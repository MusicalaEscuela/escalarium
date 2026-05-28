export const CAMPAIGN_ZONES = [
  {
    id: "tonal",
    order: 1,
    name: "Forja Tonal",
    subtitle: "Mayor, menor y ortografía funcional",
    icon: "◆",
    mood: "Base del reino",
    description: "Construye escalas tonales con escritura correcta. Aquí no basta sonar bien: toca escribir bien, porque el pentagrama también tiene sentimientos, aparentemente.",
    unlockText: "Disponible desde el inicio",
    boss: {
      name: "El Notario Enharmónico",
      title: "Guardián de la ortografía",
      taunt: "Do sostenido no es Re bemol si la función dice otra cosa. Qué sorpresa, la teoría tiene contexto."
    },
    challengeMix: ["forge", "audit", "formula", "mutation"]
  },
  {
    id: "modes",
    order: 2,
    name: "Cámara Modal",
    subtitle: "Modos, centros y grados característicos",
    icon: "◈",
    mood: "Centro gravitacional",
    description: "Distingue colores modales, transforma escalas y defiende el centro tonal sin caer en el pantano de “todo es relativo”.",
    unlockText: "Supera el primer boss tonal",
    boss: {
      name: "El Locrio Inseguro",
      title: "Custodio del ♭5",
      taunt: "Te va a preguntar si esto es locrio, locrio ♮2 o simple tristeza mal escrita."
    },
    challengeMix: ["forge", "audit", "formula", "mutation", "identify"]
  },
  {
    id: "dominants",
    order: 3,
    name: "Dominantes Alterados",
    subtitle: "Escala-acorde y tensiones con mala actitud",
    icon: "✦",
    mood: "Tensión útil",
    description: "Resuelve contextos armónicos: 7#11, 7alt, 7♭9, m7♭5. La vida no era suficientemente confusa, entonces inventamos el jazz.",
    unlockText: "Supera el boss modal",
    boss: {
      name: "El Dominante Alterado",
      title: "Señor de ♭9 y #9",
      taunt: "Llega con tensiones, no pide permiso y encima espera que escribas todo bien."
    },
    challengeMix: ["chord", "forge", "audit", "formula", "mutation"]
  },
  {
    id: "colors",
    order: 4,
    name: "Jardín de Colores",
    subtitle: "Pentatónicas, blues y escalas de carácter",
    icon: "✺",
    mood: "Sonoridad aplicada",
    description: "Menos academia muerta y más color real: pentatónicas, blues, armónicas y modos raros usados con intención.",
    unlockText: "Supera el boss dominante",
    boss: {
      name: "La Bestia del Blue Note",
      title: "Guardiana del cromatismo expresivo",
      taunt: "Una nota puede ser color o puede ser accidente. Aquí se decide cuál, sin drama barato."
    },
    challengeMix: ["forge", "audit", "formula", "identify", "chord"]
  },
  {
    id: "symmetry",
    order: 5,
    name: "Abismo Simétrico",
    subtitle: "Disminuidas, tonos enteros y caos ordenado",
    icon: "✹",
    mood: "Geometría sonora",
    description: "Escalas simétricas, patrones repetitivos y decisiones rápidas. El lugar donde la tonalidad mira desde lejos y finge que todo está bien.",
    unlockText: "Supera el boss de colores",
    boss: {
      name: "La Esfinge Simétrica",
      title: "Arquitecta del caos circular",
      taunt: "Ocho notas, cero piedad y un patrón que no perdona despistes."
    },
    challengeMix: ["chord", "forge", "audit", "formula", "identify"]
  }
];

export const ZONE_BY_ID = Object.fromEntries(CAMPAIGN_ZONES.map((zone) => [zone.id, zone]));

export const GAME_RULES = {
  roundsPerBoss: 5,
  lives: 3,
  unlockScore: 450,
  perfectBonus: 80,
  streakBonus: 15
};
