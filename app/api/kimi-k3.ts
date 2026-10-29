/**
 * Kimi K3 pipeline service — the core AI layer of GhostWriter Studio.
 *
 * Talks to an OpenAI-compatible Moonshot endpoint (1M-token multimodal
 * context, vision capable). Configuration via environment:
 *
 *   KIMI_API_KEY   — Moonshot/Kimi API key. When absent the module runs in
 *                    MOCK MODE and returns realistic placeholder prose so the
 *                    app is fully usable in preview without a key. Mock mode
 *                    must NEVER crash the server.
 *   KIMI_API_BASE  — Base URL (default: https://api.moonshot.ai/v1)
 *   KIMI_MODEL     — Model name (default: kimi-k3)
 */

const API_BASE = process.env.KIMI_API_BASE ?? "https://api.moonshot.ai/v1";
const MODEL = process.env.KIMI_MODEL ?? "kimi-k3";
const API_KEY = process.env.KIMI_API_KEY ?? "";

export const isMockMode = API_KEY.length === 0;

// ── Low-level client ─────────────────────────────────────────────

type ChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

async function chatCompletion(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; json?: boolean } = {},
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.8,
      max_tokens: opts.maxTokens ?? 8192,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Kimi K3 request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Kimi K3 returned an empty completion");
  return content;
}

// ── Mock prose helpers ───────────────────────────────────────────

const MOCK_SENTENCES = [
  "The morning light came through the curtains the way it always had, thin and patient, and for a moment I believed the house was still holding its breath for you.",
  "I remember thinking that memory is not a ledger but a shoreline — everything arrives twice, once as the wave and once as the foam it leaves behind.",
  "There was a radio in the kitchen that only worked when it rained, and we loved it more for its stubbornness.",
  "You would have laughed at how carefully I kept your letters, ordered not by date but by the weight of what they carried.",
  "What I did not say then fills whole rooms now; silence, I have learned, is only speech that has gone underground.",
  "The road out of town bends like a question mark, and every year I answer it a little differently.",
  "Grief, when it finally came, did not knock — it moved in quietly and began rearranging the furniture of ordinary days.",
  "But there was joy too, the kind that sneaks up on you in the middle of washing dishes, uninvited and entirely welcome.",
];

function mockParagraphs(count: number, seed = 0): string {
  const out: string[] = [];
  for (let p = 0; p < count; p++) {
    const sentences: string[] = [];
    for (let s = 0; s < 4; s++) {
      sentences.push(
        MOCK_SENTENCES[(seed + p * 4 + s) % MOCK_SENTENCES.length],
      );
    }
    out.push(sentences.join(" "));
  }
  return out.join("\n\n");
}

// ── Public API ───────────────────────────────────────────────────

export interface HandwritingAnalysis {
  transcription: string;
  styleSummary: string;
  layoutCues: string;
}

/**
 * Vision call: transcribe handwriting scans and analyse the writer's voice.
 * `imageUrls` may be https URLs or data-URLs; sent as image_url content parts.
 */
export async function analyzeHandwriting(
  imageUrls: string[],
  mimeType = "image/jpeg",
): Promise<HandwritingAnalysis> {
  if (isMockMode || imageUrls.length === 0) {
    return {
      transcription: mockParagraphs(3),
      styleSummary:
        "Voice analysis (mock): a reflective first-person voice with long, " +
        "rolling cadences; vocabulary leans domestic and tactile (kitchens, " +
        "weather, letters, roads); tone is tender with dry understatement; " +
        "quirks include em-dash pivots, second-person address to the " +
        "departed, and aphoristic closings.",
      layoutCues:
        "Mock layout: ruled A4 pages, right-slanting cursive, wide left " +
        "margin annotations, frequent underlining for emphasis.",
    };
  }

  const content: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a paleographer and literary stylist. Transcribe handwritten " +
        "pages exactly, then analyse the author's voice with a working " +
        "novelist's eye. Respond as strict JSON with keys: transcription " +
        "(string), styleSummary (string covering tone, cadence, vocabulary, " +
        "quirks), layoutCues (string describing page layout, marginalia, " +
        "emphasis marks).",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text:
            `Transcribe these ${imageUrls.length} handwritten page(s) ` +
            `(${mimeType}) and produce the voice analysis JSON.`,
        },
        ...imageUrls.map((url) => ({
          type: "image_url" as const,
          image_url: { url },
        })),
      ],
    },
  ];
  const raw = await chatCompletion(content, { json: true, maxTokens: 8192 });
  try {
    const parsed = JSON.parse(raw) as Partial<HandwritingAnalysis>;
    return {
      transcription: parsed.transcription ?? "",
      styleSummary: parsed.styleSummary ?? "",
      layoutCues: parsed.layoutCues ?? "",
    };
  } catch {
    return { transcription: raw, styleSummary: raw.slice(0, 2000), layoutCues: "" };
  }
}

export interface BlueprintChapter {
  index: number;
  title: string;
  summary: string;
  targetWords: number;
}

export interface Blueprint {
  title: string;
  logline: string;
  acts: Array<{ act: number; goal: string; chapters: number[] }>;
  chapters: BlueprintChapter[];
}

/** Generate a 3-act arc + chapter breakdown as JSON. */
export async function generateBlueprint(
  premise: string,
  genre: string,
  voiceSummaries: string[],
  targetWords: number,
): Promise<Blueprint> {
  const chapterCount = Math.max(6, Math.min(40, Math.round(targetWords / 2500)));

  if (isMockMode) {
    const chapters: BlueprintChapter[] = Array.from(
      { length: chapterCount },
      (_, i) => ({
        index: i,
        title: `Chapter ${i + 1}: ${["The Shoreline", "What the Rain Knew", "A Ledger of Small Things", "The Bend in the Road", "Underground Speech", "Foam and Returning"][i % 6]}`,
        summary: `Mock chapter ${i + 1} advances the premise "${premise.slice(0, 120)}" through act ${i < chapterCount / 3 ? 1 : i < (2 * chapterCount) / 3 ? 2 : 3}.`,
        targetWords: Math.round(targetWords / chapterCount),
      }),
    );
    return {
      title: "The House That Held Its Breath",
      logline: `A ${genre} novel grown from: ${premise.slice(0, 200)}`,
      acts: [
        { act: 1, goal: "Establish the world, the wound, and the want.", chapters: chapters.slice(0, Math.ceil(chapterCount / 3)).map((c) => c.index) },
        { act: 2, goal: "Complicate, confront, and cost the protagonist dearly.", chapters: chapters.slice(Math.ceil(chapterCount / 3), Math.ceil((2 * chapterCount) / 3)).map((c) => c.index) },
        { act: 3, goal: "Reckon, resolve, and leave one door open.", chapters: chapters.slice(Math.ceil((2 * chapterCount) / 3)).map((c) => c.index) },
      ],
      chapters,
    };
  }

  const raw = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You are a master plot architect. Design a complete 3-act novel " +
          "structure as strict JSON: { title, logline, acts: [{act, goal, " +
          "chapters: [chapterIndexes]}], chapters: [{index, title, summary, " +
          "targetWords}] }. Chapter summaries must be specific enough that a " +
          "writer who only reads the outline maintains perfect continuity.",
      },
      {
        role: "user",
        content:
          `Premise: ${premise}\nGenre: ${genre}\nTarget length: ${targetWords} words ` +
          `across ~${chapterCount} chapters.\nAuthor voice(s) to honour:\n` +
          voiceSummaries.map((v, i) => `Voice ${i + 1}: ${v}`).join("\n"),
      },
    ],
    { json: true, maxTokens: 8192, temperature: 0.7 },
  );
  const parsed = JSON.parse(raw) as Blueprint;
  if (!Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
    throw new Error("Kimi K3 returned a blueprint with no chapters");
  }
  return parsed;
}

/**
 * Write one full chapter. Every prompt carries the condensed master outline
 * plus the voice corpus so the swarm maintains global consistency. Chapters
 * are written sequentially by the caller to avoid drift (Studio tier may
 * parallelise; the API is per-chapter either way).
 */
export async function writeChapter(
  blueprint: Blueprint,
  chapterIndex: number,
  voiceSummaries: string[],
  priorChapterSummaries: string[],
): Promise<string> {
  const chapter = blueprint.chapters.find((c) => c.index === chapterIndex);
  const title = chapter?.title ?? `Chapter ${chapterIndex + 1}`;

  if (isMockMode) {
    const paras = Math.max(6, Math.min(14, Math.round((chapter?.targetWords ?? 2000) / 300)));
    return `# ${title}\n\n${mockParagraphs(paras, chapterIndex * 7)}`;
  }

  const condensedOutline = blueprint.chapters
    .map((c) => `${c.index + 1}. ${c.title} — ${c.summary}`)
    .join("\n");
  return chatCompletion(
    [
      {
        role: "system",
        content:
          "You are a ghostwriter channeling a specific human voice. Write " +
          "immersive, literary prose that is indistinguishable from the " +
          "author whose voice corpus follows. Maintain perfect continuity " +
          "with the master outline and prior chapters. Output prose only, " +
          "beginning with a markdown H1 chapter title.",
      },
      {
        role: "user",
        content:
          `MASTER OUTLINE:\n${condensedOutline}\n\n` +
          `VOICE CORPUS (write in exactly this style):\n${voiceSummaries.join("\n---\n")}\n\n` +
          `PRIOR CHAPTERS (for continuity):\n${priorChapterSummaries.join("\n") || "(none yet)"}\n\n` +
          `Now write chapter ${chapterIndex + 1} in full: "${title}". ` +
          `Chapter brief: ${chapter?.summary ?? "advance the story"}. ` +
          `Aim for ~${chapter?.targetWords ?? 2000} words.`,
      },
    ],
    { maxTokens: 8192, temperature: 0.85 },
  );
}

/**
 * Targeted in-place rewrite of a highlighted passage. `styleWeight` (1.0–5.0)
 * scales how aggressively the original handwriting style is imposed:
 * 1.0 = a whisper of their voice, 5.0 = deep possession.
 */
export async function inpaintRewrite(
  selectedText: string,
  styleWeight: number,
  voiceCorpus: string,
  surroundingContext: string,
): Promise<string> {
  const clamped = Math.max(1, Math.min(5, styleWeight));

  if (isMockMode) {
    const intensity =
      clamped >= 4 ? "with the full cadence of the original hand" : clamped >= 2 ? "lightly touched by the original voice" : "with only a whisper of the source style";
    return (
      `${selectedText.split(/\s+/).slice(0, 3).join(" ")} … rewritten ${intensity}: ` +
      mockParagraphs(2, Math.round(clamped))
    );
  }

  return chatCompletion(
    [
      {
        role: "system",
        content:
          "You perform surgical style inpainting on prose: rewrite ONLY the " +
          "selected passage so it reads as written by the author in the " +
          "voice corpus, while preserving its meaning and fitting the " +
          "surrounding context seamlessly. Return only the rewritten passage.",
      },
      {
        role: "user",
        content:
          `STYLE INTENSITY: ${clamped.toFixed(1)} / 5.0 (1.0 = whisper of ` +
          `their voice, 5.0 = deep possession — fully saturate the passage ` +
          `with their cadence, vocabulary and quirks).\n\n` +
          `VOICE CORPUS:\n${voiceCorpus}\n\n` +
          `SURROUNDING CONTEXT:\n${surroundingContext}\n\n` +
          `PASSAGE TO REWRITE:\n${selectedText}`,
      },
    ],
    { maxTokens: 4096, temperature: 0.6 + clamped * 0.08 },
  );
}
