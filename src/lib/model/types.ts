export type ModelId = 'lite' | 'balanced' | 'deep';

export type ModelInfo = {
  id: ModelId;
  name: string;
  description: string;
  sizeGb: number;
  bestFit: boolean;
  /** The underlying Gemma checkpoint, per the architecture doc §3.1. */
  checkpoint: string;
  /** INT4 quantization throughout, per the architecture doc §3.1. */
  quantization: string;
  minRamGb: number;
};

/**
 * Three Gemma checkpoints, INT4-quantized — see
 * on_device_ai_student_companion.md §3.1 "Model & Quantization". Sizes are
 * the doc's own compressed-on-disk figures; a 2B model at INT4 lands around
 * 1.2–1.5GB, so "Lite" and "Balanced" bracket that range and "Deep" is the
 * larger reasoning-tier checkpoint.
 */
export const MODELS: ModelInfo[] = [
  {
    id: 'lite',
    name: 'Lite',
    // Deliberately generic, not "simple quizzes": any feature built later on
    // structured output (diagrams, flashcards, study plans, not just quizzes)
    // leans on the same instruction-following a smaller model is weaker at.
    // Scoped by INTERACTION MODE, not topic difficulty — Lite is a plain
    // conversational tutor, not a "simple topics only" model.
    description: 'Fastest replies · simple conversational learning',
    sizeGb: 1.1,
    bestFit: false,
    checkpoint: 'Gemma 2B-it',
    quantization: 'INT4',
    minRamGb: 4,
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Clear explanations · diagrams, quizzes & more',
    sizeGb: 2.4,
    bestFit: true,
    checkpoint: 'Gemma 4 E2B-it',
    quantization: 'INT4',
    minRamGb: 6,
  },
  {
    id: 'deep',
    name: 'Deep',
    // Everything Balanced does, plus harder multi-step reasoning — not a
    // different capability tier, a deeper one on top of the same tier.
    description: 'Everything in Balanced · harder, multi-step reasoning',
    sizeGb: 4.3,
    bestFit: false,
    checkpoint: 'Gemma 4 E2B-it',
    quantization: 'INT4, extended context',
    minRamGb: 8,
  },
];
