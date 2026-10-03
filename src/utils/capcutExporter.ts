import { VideoClip, CaptionSegment } from '../types/editor';

// Trigger download in browser
export function downloadFile(content: string | Blob, fileName: string, mimeType: string = 'text/plain;charset=utf-8') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate CapCut Desktop draft_content.json file
export function generateCapCutDraft(
  projectName: string,
  clips: VideoClip[],
  captions: CaptionSegment[],
  format: '16:9' | '9:16',
  videoFileName: string = 'fuente.mp4'
) {
  const width = format === '9:16' ? 1080 : 1920;
  const height = format === '9:16' ? 1920 : 1080;
  const fps = 30;

  const validClips = clips.filter(c => !c.isSilence);
  const totalDurationUs = Math.round(validClips.reduce((acc, c) => acc + (c.end - c.start), 0) * 1000000);

  const draftJson = {
    canvas_config: {
      height,
      ratio: format === '9:16' ? '9:16' : '16:9',
      width,
    },
    duration: totalDurationUs,
    fps,
    materials: {
      videos: [
        {
          id: 'mat_video_0',
          material_name: videoFileName,
          path: videoFileName,
          type: 'video',
          duration: totalDurationUs * 2,
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
      texts: captions.map((cap, idx) => ({
        id: `text_mat_${idx}`,
        content: cap.text,
        type: 'text',
        font_size: 40,
        text_color: '#FFFFFF',
      })),
    },
    tracks: [
      {
        id: 'track_video_cuts',
        type: 'video',
        segments: validClips.map((clip, index) => {
          const durationUs = Math.round((clip.end - clip.start) * 1000000);
          const offsetUs = Math.round(
            validClips.slice(0, index).reduce((acc, prev) => acc + (prev.end - prev.start), 0) * 1000000
          );
          return {
            id: `seg_v_${clip.id || index}`,
            material_id: 'mat_video_0',
            source_timerange: {
              start: Math.round(clip.start * 1000000),
              duration: durationUs,
            },
            target_timerange: {
              start: offsetUs,
              duration: durationUs,
            },
            speed: 1.0,
            scale: clip.hasZoomPunchIn ? { x: 1.25, y: 1.25 } : { x: 1.0, y: 1.0 },
          };
        }),
      },
      {
        id: 'track_subtitles',
        type: 'text',
        segments: captions.map((cap, index) => ({
          id: `seg_text_${cap.id || index}`,
          material_id: `text_mat_${index}`,
          target_timerange: {
            start: Math.round(cap.start * 1000000),
            duration: Math.round((cap.end - cap.start) * 1000000),
          },
        })),
      },
    ],
    version: 2,
  };

  return JSON.stringify(draftJson, null, 2);
}

// Generate EDL (Edit Decision List)
export function generateEDL(
  projectName: string,
  clips: VideoClip[],
  videoFileName: string = 'video.mp4',
  fps: number = 30
): string {
  const validClips = clips.filter(c => !c.isSilence);
  let edl = `TITLE: ${projectName.toUpperCase()}\nFCM: NON-DROP FRAME\n\n`;
  let currentDstSeconds = 0;

  validClips.forEach((clip, index) => {
    const duration = clip.end - clip.start;
    const srcIn = secondsToEdlTimecode(clip.start, fps);
    const srcOut = secondsToEdlTimecode(clip.end, fps);
    const dstIn = secondsToEdlTimecode(currentDstSeconds, fps);
    const dstOut = secondsToEdlTimecode(currentDstSeconds + duration, fps);
    currentDstSeconds += duration;

    const num = String(index + 1).padStart(3, '0');
    edl += `${num}  AX       AA/V  C        ${srcIn} ${srcOut} ${dstIn} ${dstOut}\n`;
    edl += `* FROM CLIP NAME: ${videoFileName}\n`;
    if (clip.hasZoomPunchIn) {
      edl += `* EFFECT: ZOOM PUNCH-IN 1.25X\n`;
    }
    edl += `\n`;
  });

  return edl;
}

// Generate SRT Subtitles
export function generateSRT(captions: CaptionSegment[]): string {
  let srt = '';
  captions.forEach((cap, idx) => {
    srt += `${idx + 1}\n`;
    srt += `${secondsToSrtTimecode(cap.start)} --> ${secondsToSrtTimecode(cap.end)}\n`;
    srt += `${cap.text}\n\n`;
  });
  return srt;
}

function secondsToEdlTimecode(seconds: number, fps: number = 30): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * fps);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}:${pad2(f)}`;
}

function secondsToSrtTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${String(ms).padStart(3, '0')}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
