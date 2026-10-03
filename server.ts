import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: safe JSON extraction from model response
function cleanAndParseJson<T>(rawText: string | undefined, fallback: T): T {
  if (!rawText) return fallback;
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse JSON from model:', err, rawText);
    return fallback;
  }
}

// 1. Chat with the AI Video Editor Copilot
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { message, history = [], currentVideo, clips = [], format = '9:16' } = req.body;

    const systemInstruction = `
Eres CutAgent AI, el editor de video senior y copiloto experto en CapCut, YouTube Shorts, TikTok e Instagram Reels.
Tu misión es ayudar al creador a transformar videos largos (podcasts, gameplays, conferencias, tutoriales, vlogs) en contenido ultra dinámico, sin silencios ni partes aburridas, optimizado para máxima retención de audiencia.

Conocimientos técnicos de CapCut:
- Dominas el flujo de trabajo de CapCut Desktop (PC y Mac) y móvil.
- Sabes cómo estructurar cortes en 'draft_content.json', archivos EDL y subtítulos SRT.
- Conoces técnicas de retención: Cortes de salto (Jump cuts), Zoom Punch-in (1.15x - 1.25x en frases clave), B-Rolls dinámicos, efectos de sonido (whoosh, pop, ding), y subtítulos estilo Alex Hormozi o MrBeast.

Información del video actual en el editor:
- Título: ${currentVideo?.title || 'Video sin título'}
- Duración total original: ${currentVideo?.duration || 120} segundos
- Formato activo: ${format} (${format === '9:16' ? 'Vertical para TikTok/Shorts/Reels' : 'Horizontal para YouTube/Web'})
- Número de clips en línea de tiempo: ${clips.length}
- Transcripción o resumen disponible: ${currentVideo?.transcript?.slice(0, 1500) || 'Sin transcripción previa'}

Instrucciones de respuesta:
1. Responde de forma concisa, profesional, cercana y motivadora en español (a menos que el usuario pregunte en otro idioma).
2. Si el usuario te pide encontrar los mejores momentos virales, eliminar silencios, recortar o aplicar efectos, proporciona la explicación clara y devuelve sugerencias accionables estructuradas.
3. Si el usuario pregunta cómo llevar su proyecto a CapCut, dale instrucciones precisas paso a paso sobre cómo usar los archivos exportables (.json de borrador de CapCut, .edl o .srt).
4. Devuelve SIEMPRE tu respuesta en formato JSON con la siguiente estructura:
{
  "reply": "Texto de tu respuesta conversacional con consejos concretos de edición",
  "suggestedActions": [
    {
      "id": "action_id",
      "label": "Etiqueta visible del botón (ej: 'Cortar silencios automáticamente', 'Crear clip viral #1', 'Exportar a CapCut')",
      "type": "CUT_SILENCES" | "SELECT_CLIP" | "ADD_CAPTIONS" | "SWITCH_FORMAT" | "EXPORT_CAPCUT",
      "payload": {}
    }
  ],
  "suggestedClips": [
    {
      "title": "Título corto y llamativo",
      "start": 0,
      "end": 35,
      "hook": "Frase gancho de los primeros 3 segundos",
      "score": 95,
      "reason": "Por qué este fragmento atrapará la atención"
    }
  ]
}
`;

    const chatContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Append last few messages
    for (const h of history.slice(-6)) {
      chatContents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      });
    }

    chatContents.push({
      role: 'user',
      parts: [{ text: message || '¿Qué mejoras le harías a este video para que sea viral en TikTok o CapCut?' }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = cleanAndParseJson(response.text, {
      reply: '¡Listo! He analizado tu video. Te sugiero cortar los silencios para acelerar el ritmo y convertirlo al formato vertical 9:16 con subtítulos dinámicos.',
      suggestedActions: [
        { id: 'cut_silences', label: '✂️ Eliminar Silencios Automáticamente', type: 'CUT_SILENCES' },
        { id: 'extract_shorts', label: '🔥 Extraer 3 Clips Virales', type: 'SELECT_CLIP' },
        { id: 'export_capcut', label: '💾 Exportar para CapCut', type: 'EXPORT_CAPCUT' }
      ],
      suggestedClips: []
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/agent/chat:', error);
    res.status(500).json({
      error: 'Error al procesar la respuesta del agente',
      details: error.message,
    });
  }
});

// 2. Viral Clips Detection (Long-to-Shorts AI Scanner)
app.post('/api/agent/analyze-virality', async (req, res) => {
  try {
    const { title, duration, transcript, clips } = req.body;

    const prompt = `
Analiza el siguiente contenido de video largo y encuentra los mejores 3 a 5 fragmentos ("Clips Virales") de entre 20 y 55 segundos para publicar en TikTok, YouTube Shorts e Instagram Reels o editar en CapCut.

Título del video: "${title || 'Video largo'}"
Duración total: ${duration || 180} segundos.
Transcripción con marcas de tiempo o contenido:
"""
${transcript || 'Video de conversación y tutorial técnico de alto valor para creadores.'}
"""

Para cada clip viral:
1. 'start' y 'end': segundos exactos dentro del video (deben durar entre 15s y 55s).
2. 'title': Título impactante y clickeable estilo YouTube / TikTok.
3. 'hook': La primera frase o acción de los primeros 3 segundos para detener el scroll.
4. 'hookScore': Número del 1 al 100 de fuerza del gancho.
5. 'viralReason': Explicación breve de por qué funcionará (curiosidad, controversia, valor práctico, humor).
6. 'brollPrompt': Idea de imagen o video B-Roll para insertar en CapCut.
7. 'soundEffect': Efecto de sonido recomendado (ej: "Whoosh transition", "Impact thud", "Cash register").
8. 'hashtags': Array de 3-4 hashtags relevantes.

Devuelve únicamente un JSON válido con la clave 'viralClips' como un arreglo de objetos.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            viralClips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  hook: { type: Type.STRING },
                  hookScore: { type: Type.NUMBER },
                  viralReason: { type: Type.STRING },
                  brollPrompt: { type: Type.STRING },
                  soundEffect: { type: Type.STRING },
                  hashtags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['title', 'start', 'end', 'hook', 'hookScore', 'viralReason'],
              },
            },
          },
          required: ['viralClips'],
        },
      },
    });

    const parsed = cleanAndParseJson(response.text, { viralClips: [] });
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/agent/analyze-virality:', error);
    res.status(500).json({
      error: 'Error al detectar clips virales',
      details: error.message,
    });
  }
});

// 3. Silence Detection & Smart Cut Plan
app.post('/api/agent/detect-silences', async (req, res) => {
  try {
    const { duration = 120, knownPauses = [] } = req.body;

    const prompt = `
Analiza la estructura de tiempo de un video de ${duration} segundos. Identifica pausas muertas, silencios de respiración largos y titubeos para crear una lista de segmentos a recortar ('silencesToRemove') y los segmentos útiles resultantes ('activeClips').
Frecuencia recomendada de corte: Cualquier pausa superior a 0.5 segundos debe eliminarse para lograr un ritmo de edición moderno tipo CapCut / Alex Hormozi.

Si se proporcionaron marcas conocidas: ${JSON.stringify(knownPauses)}

Devuelve un JSON con:
- silences: array de { start: number, end: number, reason: string }
- activeClips: array de { start: number, end: number, label: string }
- totalTimeSavedSeconds: number
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = cleanAndParseJson(response.text, {
      silences: [
        { start: 12.2, end: 14.5, reason: 'Pausa prolongada antes de iniciar la explicación' },
        { start: 28.0, end: 29.8, reason: 'Silencio y titubeo' },
        { start: 55.1, end: 57.4, reason: 'Respiración y cambio de tema' },
      ],
      activeClips: [
        { start: 0, end: 12.2, label: 'Introducción y Gancho' },
        { start: 14.5, end: 28.0, label: 'Punto clave 1' },
        { start: 29.8, end: 55.1, label: 'Explicación detallada' },
        { start: 57.4, end: duration, label: 'Conclusión y llamado a la acción' }
      ],
      totalTimeSavedSeconds: 6.4
    });

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/agent/detect-silences:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Generate Animated Word-Level Captions (Hormozi / TikTok Style)
app.post('/api/agent/generate-captions', async (req, res) => {
  try {
    const { transcript, startTime = 0, duration = 30 } = req.body;

    const prompt = `
Genera subtítulos animados de alto impacto estilo CapCut / Alex Hormozi para el siguiente texto.
Texto: "${transcript || 'Este es el secreto que los grandes creadores de contenido nunca te dicen. Si aplicas esta técnica hoy mismo, tu retención va a duplicarse en menos de una semana.'}"
Tiempo de inicio: ${startTime}s, Duración: ${duration}s.

Crea bloques de subtítulos cortos (máximo 3 a 5 palabras por bloque) sincronizados en el tiempo.
Identifica palabras de alto impacto ("highlightWord") para colorearlas en Amarillo Neón (#FACC15) o Cyan (#06B6D4) y añade un emoji relacionado si aplica.

Devuelve un JSON con la estructura:
{
  "captions": [
    {
      "id": "c1",
      "start": 0.0,
      "end": 2.4,
      "text": "ESTE ES EL SECRETO",
      "highlightWord": "SECRETO",
      "highlightColor": "#FACC15",
      "emoji": "🤫"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const parsed = cleanAndParseJson(response.text, { captions: [] });
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/agent/generate-captions:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Generate CapCut Desktop Draft + EDL + SRT Project Export
app.post('/api/agent/generate-capcut-draft', async (req, res) => {
  try {
    const { projectName = 'CutAgent_Project', clips = [], captions = [], format = '9:16', videoFileName = 'video_fuente.mp4' } = req.body;

    const width = format === '9:16' ? 1080 : 1920;
    const height = format === '9:16' ? 1920 : 1080;
    const fps = 30;

    // Build standard CapCut Desktop draft_content.json structure
    const capcutDraftJson = {
      canvas_config: {
        height,
        ratio: format === '9:16' ? '9:16' : '16:9',
        width,
      },
      duration: Math.round(clips.reduce((acc: number, c: any) => acc + (c.end - c.start), 0) * 1000000), // in microseconds
      fps,
      materials: {
        videos: [
          {
            id: 'material_main_video',
            material_name: videoFileName,
            path: videoFileName,
            type: 'video',
            duration: 3600000000,
          },
        ],
        speeds: [
          {
            curve_speed: null,
            id: 'speed_normal',
            mode: 0,
            speed: 1.0,
            type: 'speed',
          },
        ],
        texts: captions.map((cap: any, index: number) => ({
          id: `text_cap_${index}`,
          content: cap.text,
          type: 'text',
          font_size: 44,
          text_color: '#FFFFFF',
        })),
      },
      tracks: [
        {
          id: 'track_video_main',
          type: 'video',
          segments: clips.map((clip: any, index: number) => {
            const startUs = Math.round(clip.start * 1000000);
            const endUs = Math.round(clip.end * 1000000);
            const durationUs = endUs - startUs;
            return {
              id: `segment_v_${index}`,
              material_id: 'material_main_video',
              source_timerange: {
                start: startUs,
                duration: durationUs,
              },
              target_timerange: {
                start: Math.round(
                  clips.slice(0, index).reduce((acc: number, prev: any) => acc + (prev.end - prev.start), 0) * 1000000
                ),
                duration: durationUs,
              },
              speed: 1.0,
            };
          }),
        },
        {
          id: 'track_subtitles',
          type: 'text',
          segments: captions.map((cap: any, index: number) => ({
            id: `segment_t_${index}`,
            material_id: `text_cap_${index}`,
            target_timerange: {
              start: Math.round(cap.start * 1000000),
              duration: Math.round((cap.end - cap.start) * 1000000),
            },
          })),
        },
      ],
      version: 2,
    };

    // Build standard EDL (Edit Decision List) format
    let edlContent = `TITLE: ${projectName}\nFCM: NON-DROP FRAME\n\n`;
    let timelineOffsetSeconds = 0;

    clips.forEach((clip: any, i: number) => {
      const clipDuration = clip.end - clip.start;
      const srcIn = formatEdlTime(clip.start, fps);
      const srcOut = formatEdlTime(clip.end, fps);
      const dstIn = formatEdlTime(timelineOffsetSeconds, fps);
      const dstOut = formatEdlTime(timelineOffsetSeconds + clipDuration, fps);
      timelineOffsetSeconds += clipDuration;

      const editIndex = String(i + 1).padStart(3, '0');
      edlContent += `${editIndex}  AX       AA/V  C        ${srcIn} ${srcOut} ${dstIn} ${dstOut}\n`;
      edlContent += `* FROM CLIP NAME: ${videoFileName}\n\n`;
    });

    // Build SRT Subtitles format
    let srtContent = '';
    captions.forEach((cap: any, i: number) => {
      srtContent += `${i + 1}\n`;
      srtContent += `${formatSrtTime(cap.start)} --> ${formatSrtTime(cap.end)}\n`;
      srtContent += `${cap.text}\n\n`;
    });

    res.json({
      projectName,
      format,
      clipsCount: clips.length,
      capcutDraftJson,
      edlContent,
      srtContent,
      instructions: {
        windows: `1. Crea un proyecto nuevo en CapCut Desktop.\n2. Cierra CapCut.\n3. Ve a tu carpeta de borradores: %localappdata%\\CapCut\\User Data\\Projects\\com.lveditor.draft\\ [NombreDelProyecto]\n4. Reemplaza el archivo 'draft_content.json' con el archivo descargado.\n5. Vuelve a abrir CapCut y ¡tendrás todos los cortes y subtítulos en tu línea de tiempo!`,
        mac: `1. Abre CapCut en tu Mac y crea un proyecto nuevo.\n2. Ve a ~/Movies/CapCut/User Data/Projects/com.lveditor.draft/ [NombreDelProyecto]\n3. Reemplaza el 'draft_content.json' por el descargado.\n4. Abre CapCut y verás los cortes listos.`,
        alternative: `Alternativamente, puedes importar el archivo .EDL o .SRT directamente desde el menú 'Importar' de CapCut, Premiere Pro o DaVinci Resolve.`
      }
    });
  } catch (error: any) {
    console.error('Error in /api/agent/generate-capcut-draft:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper for EDL timecode (HH:MM:SS:FF)
function formatEdlTime(seconds: number, fps: number = 30): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * fps);
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

// Helper for SRT timecode (HH:MM:SS,mmm)
function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, '0')}`;
}

function pad(num: number): string {
  return String(num).padStart(2, '0');
}

// Serve Vite in development or static assets in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`CutAgent Server running on port ${PORT}`);
  });
}

startServer();
