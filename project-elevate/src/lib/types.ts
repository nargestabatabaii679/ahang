export type Occasion =
  | "birthday"
  | "anniversary"
  | "appreciation"
  | "apology"
  | "celebration"
  | "none";

export type Relationship =
  | "partner"
  | "family"
  | "friend"
  | "coworker"
  | "special"
  | "other";

/**
 * The mood/feeling the person picks for the song. Internally we keep the
 * field name `genre` (it still drives genre-specific music-generation
 * prompts in riffusion.ts/lyrics.ts) but the values and labels are mood
 * words, not music-jargon genres — picking a *feeling* is far more
 * intuitive for a non-musician audience than picking "lofi" or "acoustic".
 */
export type Genre =
  | "romantic"
  | "emotional"
  | "happy"
  | "calm"
  | "motivational"
  | "nostalgic";

export interface SongBrief {
  recipientName: string;
  relationship: Relationship;
  /** required when relationship === "other" */
  relationshipOther?: string;
  occasion: Occasion;
  genre: Genre;
  /** optional free text: what the song should be about */
  aboutText: string;
  /** server-stored paths after upload */
  photoUrl?: string;
  voiceUrl?: string;
  /**
   * Required true before the pipeline runs. The lipsync model drives a real
   * person's face from a separate audio track — dual-use technology. The
   * person submitting the job must confirm the photo's subject and the
   * voice's speaker have both consented to this use.
   */
  consent: boolean;
}

/** Ordered pipeline stages — drives the loading UI. Matches the five
 *  checkmarks in the product spec exactly; the audio mix (combining the
 *  cloned voice with the instrumental) happens internally as the tail end
 *  of the "voice" stage rather than as its own visible checkmark, and
 *  "finalize" is a short cosmetic last step ("در حال آماده‌سازی هدیه")
 *  after the video so the ending feels like a single coherent reveal. */
export type StageId = "lyrics" | "music" | "voice" | "video" | "finalize";

export type StageStatus = "pending" | "running" | "done" | "error";

export interface StageState {
  id: StageId;
  status: StageStatus;
}

export type JobStatus = "queued" | "running" | "done" | "error";

export interface Job {
  id: string;
  status: JobStatus;
  brief: SongBrief;
  stages: StageState[];
  /** 0..100 overall */
  progress: number;
  error?: string;
  result?: {
    videoUrl?: string;
    audioUrl?: string;
    musicUrl?: string;
    musicError?: string;
    voiceError?: string;
    lyrics?: string;
    coverArtUrl?: string;
  };
  createdAt: number;
}

export const STAGE_ORDER: StageId[] = [
  "lyrics",
  "music",
  "voice",
  "video",
  "finalize",
];

export const STAGE_META: Record<
  StageId,
  { title: string; caption: string }
> = {
  lyrics: {
    title: "در حال نوشتن متن آهنگ",
    caption: "از روی مناسبت و حس و حال شما",
  },
  music: {
    title: "در حال ساخت موسیقی",
    caption: "ملودی و سازبندی با Riffusion",
  },
  voice: {
    title: "در حال ساخت صدای اختصاصی",
    caption: "صدای واقعی، نشسته روی موسیقی",
  },
  video: {
    title: "در حال ساخت ویدیو",
    caption: "آواتار گویا با OmniHuman از روی عکس",
  },
  finalize: {
    title: "در حال آماده‌سازی هدیه",
    caption: "چند لحظهٔ آخر مونده",
  },
};
