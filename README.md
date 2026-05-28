# Escalarium Pro Musicala · La Forja de Escalas

Juego web avanzado para practicar escalas musicales desde construcción, auditoría enharmónica, fórmula, relación escala-acorde, identificación modal y mutación de grados.

## Qué trae

- Campaña con 5 zonas: Forja Tonal, Cámara Modal, Dominantes Alterados, Jardín de Colores y Abismo Simétrico.
- Boss fights desbloqueables.
- Retos de construcción de escalas por grados.
- Retos de auditoría: detectar y corregir una nota mal escrita.
- Retos de fórmula interválica.
- Retos de contexto armónico: elegir escala sobre acordes como 7#11, 7alt, m7b5, mMaj7, etc.
- Retos de mutación modal.
- Banco amplio de escalas: mayor, menor natural, menor armónica, menor melódica, modos, frigio dominante, lidio dominante, alterada, locria natural 2, pentatónicas, blues, tonos enteros y disminuidas.
- Evaluación con diferencia entre sonido equivalente y escritura funcional.
- Audio con Web Audio API para escuchar escalas.
- Progreso local en `localStorage`.
- PWA instalable y service worker básico.

## Cómo usar

Abre `index.html` con un servidor local. Por ejemplo:

```bash
python -m http.server 5173
```

Luego entra a:

```text
http://localhost:5173
```

También puedes subirlo a GitHub Pages como sitio estático.

## Estructura

```text
src/
  app.js                  Control principal del juego
  data/
    scales.js             Banco de escalas y notas
    campaign.js           Zonas, boss fights y reglas
    chords.js             Contextos armónicos
  core/
    theory.js             Motor musical: spelling, pitch class, evaluación
    challenges.js         Generador y calificador de retos
    audio.js              Web Audio API
    storage.js            Progreso local
  ui/
    render.js             Render de pantallas y componentes
```

## Notas de diseño

La idea no es que sea una app de teoría con punticos. El juego trabaja tres capas:

1. **Diversión:** campaña, presión, boss fights, feedback y progresión.
2. **Aprendizaje:** corrección estricta cuando la escritura importa.
3. **Rejugabilidad:** retos aleatorios por zona y diferentes tipos de desafío.

## Próximos pasos sugeridos

- Agregar Firebase para ranking compartido entre usuarios Musicala.
- Crear modo profesor para diseñar retos personalizados.
- Añadir perfiles por estudiante.
- Agregar dictado auditivo real con reconocimiento de sonoridades.
- Crear cartas coleccionables de escalas desbloqueadas.
