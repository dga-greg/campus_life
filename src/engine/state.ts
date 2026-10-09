import { z } from "zod";
import { APPEARANCE, AMBITIONS, BACKGROUNDS, BASE_STATS, HOMETOWNS, MAX_TRAITS, TRAITS } from "./content/character";
import { COURSES, getProgram, PROGRAMS } from "./content/programs";
import { seedFromString } from "./rng";
import { clampStat, STAT_KEYS, type Stats } from "./stats";

export const SAVE_SCHEMA_VERSION = 1;

const oneOf = <T extends readonly string[]>(values: T) => z.enum(values as unknown as [string, ...string[]]);

export const appearanceSchema = z.object({
  skinTone: oneOf(APPEARANCE.skinTone),
  hairstyle: oneOf(APPEARANCE.hairstyle),
  hairColor: oneOf(APPEARANCE.hairColor),
  outfit: oneOf(APPEARANCE.outfit),
  outfitColor: oneOf(APPEARANCE.outfitColor),
  accessory: oneOf(APPEARANCE.accessory),
});
export type Appearance = z.infer<typeof appearanceSchema>;

export const characterInputSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters")
    .max(24, "Keep it to 24 characters")
    .regex(/^[\p{L}\p{M}][\p{L}\p{M}\p{N} .'-]*$/u, "Letters, numbers, spaces, . ' and - only"),
  hometown: oneOf(HOMETOWNS),
  programId: z.string().refine((id) => PROGRAMS.some((p) => p.id === id), "Choose a programme"),
  backgroundId: z.string().refine((id) => BACKGROUNDS.some((b) => b.id === id), "Choose a background"),
  ambitionId: z.string().refine((id) => AMBITIONS.some((a) => a.id === id), "Choose an ambition"),
  traits: z
    .array(oneOf(TRAITS))
    .min(1, "Pick at least one trait")
    .max(MAX_TRAITS, `Pick up to ${MAX_TRAITS} traits`)
    .refine((t) => new Set(t).size === t.length, "Traits must be different"),
  appearance: appearanceSchema,
});
export type CharacterInput = z.infer<typeof characterInputSchema>;

const statsSchema = z.object(
  Object.fromEntries(STAT_KEYS.map((k) => [k, z.number().int().min(0).max(100)])) as Record<(typeof STAT_KEYS)[number], z.ZodNumber>,
);

export const PHASES = ["admission", "teaching", "exams", "vacation", "graduated"] as const;

export const gameStateSchema = z.object({
  schemaVersion: z.literal(SAVE_SCHEMA_VERSION),
  seed: z.number().int().nonnegative(),
  rng: z.number().int().nonnegative(),
  clock: z.object({
    year: z.number().int().min(1).max(4),
    semester: z.number().int().min(1).max(2),
    week: z.number().int().min(0),
    phase: z.enum(PHASES),
  }),
  character: characterInputSchema,
  stats: statsSchema,
  wallet: z.number().int().nonnegative(),
  academics: z.object({
    gradingSchemeId: z.string(),
    enrollments: z.array(z.object({ courseId: z.string(), credits: z.number().int().positive(), term: z.string() })),
    results: z.array(z.object({ courseId: z.string(), term: z.string(), score: z.number(), letter: z.string(), pointsX10: z.number().int(), credits: z.number().int() })),
    cgpaX100: z.number().int().nullable(),
  }),
  flags: z.array(z.string()),
});
export type GameState = z.infer<typeof gameStateSchema>;

export function termKey(year: number, semester: number): string {
  return `Y${year}S${semester}`;
}

/** Builds the day-zero state for a new student. Pure and deterministic. */
export function createInitialState(rawInput: unknown, seedText: string): GameState {
  const character = characterInputSchema.parse(rawInput);
  const background = BACKGROUNDS.find((b) => b.id === character.backgroundId)!;
  const program = getProgram(character.programId)!;
  const seed = seedFromString(seedText);

  const stats = { ...BASE_STATS } as Stats;
  for (const key of STAT_KEYS) stats[key] = clampStat(stats[key] + (background.statMods[key] ?? 0));

  return gameStateSchema.parse({
    schemaVersion: SAVE_SCHEMA_VERSION,
    seed,
    rng: seed,
    clock: { year: 1, semester: 1, week: 0, phase: "admission" },
    character,
    stats,
    wallet: background.startingWallet,
    academics: {
      gradingSchemeId: "amu-2026",
      enrollments: program.y1s1.map((courseId) => ({ courseId, credits: COURSES[courseId].credits, term: termKey(1, 1) })),
      results: [],
      cgpaX100: null,
    },
    flags: [...background.flags],
  } satisfies GameState);
}
