export interface VideoClip {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  label: string;
  hasZoomPunchIn?: boolean; // 1.2x punch in zoom
  isSilence?: boolean;
}

export interface CaptionSegment {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  highlightWord?: string;
  highlightColor?: string; // e.g. '#FACC15'
  emoji?: string;
}

export interface ViralClipSuggestion {
  id?: string;
  title: string;
  start: number;
  end: number;
  hook: string;
  hookScore: number; // 0 - 100
  viralReason: string;
  brollPrompt?: string;
  soundEffect?: string;
  hashtags?: string[];
}

export interface VideoProject {
  id: string;
  title: string;
  videoUrl: string;
  duration: number; // in seconds
  format: '16:9' | '9:16';
  thumbnailUrl?: string;
  transcript: string;
  clips: VideoClip[];
  captions: CaptionSegment[];
  isCustomUpload?: boolean;
  fileName?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  suggestedActions?: {
    id: string;
    label: string;
    type: string;
    payload?: any;
  }[];
  suggestedClips?: ViralClipSuggestion[];
}
