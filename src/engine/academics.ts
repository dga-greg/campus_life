/**
 * AMU academic rules. Fictional and configurable: real Ghanaian universities
 * use differing scales, so nothing here is hard-coded outside this scheme.
 * Grade points are stored x10 and GPA x100 so all arithmetic is integer.
 */
export interface GradeBand {
  minScore: number;
  letter: string;
  pointsX10: number;
}

export interface GradingScheme {
  id: string;
  bands: GradeBand[]; // descending by minScore
  passPointsX10: number;
  probationBelowGpaX100: number;
  classifications: { minGpaX100: number; label: string }[]; // descending
}

export const AMU_GRADING: GradingScheme = {
  id: "amu-2026",
  bands: [
    { minScore: 80, letter: "A", pointsX10: 40 },
    { minScore: 75, letter: "B+", pointsX10: 35 },
    { minScore: 70, letter: "B", pointsX10: 30 },
    { minScore: 65, letter: "C+", pointsX10: 25 },
    { minScore: 60, letter: "C", pointsX10: 20 },
    { minScore: 55, letter: "D+", pointsX10: 15 },
    { minScore: 50, letter: "D", pointsX10: 10 },
    { minScore: 0, letter: "F", pointsX10: 0 },
  ],
  passPointsX10: 10,
  probationBelowGpaX100: 150,
  classifications: [
    { minGpaX100: 360, label: "First Class Honours" },
    { minGpaX100: 300, label: "Second Class Honours (Upper Division)" },
    { minGpaX100: 250, label: "Second Class Honours (Lower Division)" },
    { minGpaX100: 200, label: "Third Class" },
    { minGpaX100: 100, label: "Pass" },
    { minGpaX100: 0, label: "Not eligible to graduate" },
  ],
};

export function gradeForScore(score: number, scheme: GradingScheme = AMU_GRADING): GradeBand {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError(`Score out of range: ${score}`);
  }
  return scheme.bands.find((b) => score >= b.minScore)!;
}

export interface GradedCourse {
  credits: number;
  pointsX10: number;
}

/** Credit-weighted GPA x100, rounded half up. Null when no credits attempted. */
export function gpaX100(courses: GradedCourse[]): number | null {
  let credits = 0;
  let weighted = 0;
  for (const c of courses) {
    if (!Number.isInteger(c.credits) || c.credits <= 0) throw new RangeError("Credits must be a positive integer");
    credits += c.credits;
    weighted += c.credits * c.pointsX10;
  }
  if (credits === 0) return null;
  return Math.floor((weighted * 10 * 2 + credits) / (credits * 2));
}

export function formatGpa(x100: number | null): string {
  return x100 === null ? "—" : (x100 / 100).toFixed(2);
}

export function classify(x100: number, scheme: GradingScheme = AMU_GRADING): string {
  return scheme.classifications.find((c) => x100 >= c.minGpaX100)!.label;
}

export function isOnProbation(x100: number, scheme: GradingScheme = AMU_GRADING): boolean {
  return x100 < scheme.probationBelowGpaX100;
}
