import { VideoProject } from '../types/editor';

export const DEMO_PROJECTS: VideoProject[] = [
  {
    id: 'demo-podcast-1',
    title: 'Podcast: El Secreto de la Retención y Hacks de CapCut (15 min)',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15.0,
    format: '9:16',
    thumbnailUrl: '/src/assets/images/studio_podcast_thumb_1791054600926.jpg',
    transcript: `[00:00] El 90% de los creadores cometen un error fatal en sus primeros 3 segundos: saludan y dan rodeos.
[00:04] Si no capturas la atención inmediatamente con un gancho visual y auditivo, el usuario hace scroll y tu retención cae al suelo.
[00:08] ... [Pausa de silencio 2s] ...
[00:10] En CapCut, el truco está en cortar cada respiración innecesaria, meter un zoom punch-in de 1.2x en la palabra clave y poner subtítulos bicolores.
[00:15] Cuando aplicas cortes dinámicos cada 2.5 segundos, el algoritmo de TikTok y YouTube Shorts detecta que la gente no se va.`,
    clips: [
      { id: 'clip-1', start: 0.0, end: 4.2, label: '01. Gancho inicial impactante', hasZoomPunchIn: false },
      { id: 'clip-2', start: 4.2, end: 8.5, label: '02. El error de la retención', hasZoomPunchIn: true },
      { id: 'clip-silence-1', start: 8.5, end: 10.2, label: '[Silencio / Respiración]', isSilence: true },
      { id: 'clip-3', start: 10.2, end: 15.0, label: '03. Técnica CapCut y Punch-in', hasZoomPunchIn: true },
    ],
    captions: [
      { id: 'c1', start: 0.0, end: 2.2, text: 'EL 90% DE CREADORES', highlightWord: '90%', highlightColor: '#FACC15', emoji: '⚠️' },
      { id: 'c2', start: 2.2, end: 4.2, text: 'COMETEN UN ERROR FATAL', highlightWord: 'ERROR', highlightColor: '#EF4444', emoji: '❌' },
      { id: 'c3', start: 4.2, end: 6.8, text: 'EN LOS PRIMEROS 3 SEGUNDOS', highlightWord: '3 SEGUNDOS', highlightColor: '#06B6D4', emoji: '⏱️' },
      { id: 'c4', start: 6.8, end: 8.5, text: 'EL USUARIO HACE SCROLL', highlightWord: 'SCROLL', highlightColor: '#FACC15', emoji: '📱' },
      { id: 'c5', start: 10.2, end: 12.8, text: 'CORTA CADA RESPIRACIÓN', highlightWord: 'CORTA', highlightColor: '#10B981', emoji: '✂️' },
      { id: 'c6', start: 12.8, end: 15.0, text: 'Y USA ZOOM PUNCH-IN', highlightWord: 'PUNCH-IN', highlightColor: '#FACC15', emoji: '💥' },
    ],
    fileName: 'podcast_retencion_capcut.mp4',
  },
  {
    id: 'demo-tech-2',
    title: 'Tutorial: Flujo de Trabajo Rápido para Editar Videos Largos',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    duration: 18.0,
    format: '16:9',
    thumbnailUrl: '/src/assets/images/studio_podcast_thumb_1791054600926.jpg',
    transcript: `[00:00] Bienvenidos. Hoy vamos a convertir una grabación de 1 hora en 5 piezas de contenido listas para publicar.
[00:05] Paso uno: pasar el video por el escáner de virabilidad para extraer los puntos de mayor tensión.
[00:09] ... [Pausa de silencio 1.5s] ...
[00:11] Paso dos: aplicar cortes automáticos para eliminar muletillas y silencios muertos.
[00:15] Paso tres: exportar el borrador nativo directamente a CapCut Desktop para afinar los efectos de sonido.`,
    clips: [
      { id: 'c2-1', start: 0.0, end: 5.0, label: '01. Intro: 1 hora a 5 piezas', hasZoomPunchIn: false },
      { id: 'c2-2', start: 5.0, end: 9.2, label: '02. Escaneo de virabilidad', hasZoomPunchIn: true },
      { id: 'c2-silence', start: 9.2, end: 10.8, label: '[Silencio muerto]', isSilence: true },
      { id: 'c2-3', start: 10.8, end: 18.0, label: '03. Cortes y exportación a CapCut', hasZoomPunchIn: false },
    ],
    captions: [
      { id: 'cc1', start: 0.0, end: 3.0, text: 'DE 1 HORA DE VIDEO', highlightWord: '1 HORA', highlightColor: '#06B6D4', emoji: '⏳' },
      { id: 'cc2', start: 3.0, end: 5.0, text: 'A 5 PIEZAS VIRALES', highlightWord: '5 PIEZAS', highlightColor: '#FACC15', emoji: '🔥' },
      { id: 'cc3', start: 5.0, end: 9.0, text: 'ESCANEA LOS PUNTOS CLAVE', highlightWord: 'CLAVE', highlightColor: '#10B981', emoji: '🎯' },
      { id: 'cc4', start: 10.8, end: 14.5, text: 'ELIMINA MULETILLAS Y SILENCIOS', highlightWord: 'SILENCIOS', highlightColor: '#EF4444', emoji: '✂️' },
      { id: 'cc5', start: 14.5, end: 18.0, text: 'EXPORTA NATIVO A CAPCUT', highlightWord: 'CAPCUT', highlightColor: '#FACC15', emoji: '🚀' },
    ],
    fileName: 'tutorial_flujo_capcut.mp4',
  }
];
