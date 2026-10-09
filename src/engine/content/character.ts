import { cedis, type Pesewas } from "../money";
import type { StatKey } from "../stats";

export interface Background {
  id: string;
  name: string;
  summary: string;
  upside: string;
  tradeoff: string;
  statMods: Partial<Record<StatKey, number>>;
  startingWallet: Pesewas;
  /** Residential and registration charge taken when the player accepts admission. */
  firstSemesterFees: Pesewas;
  flags: string[];
}

// Every background totals the same stat budget (+20 / -8) and differs in
// money and obligations, so none is strictly better than another.
export const BACKGROUNDS: Background[] = [
  {
    id: "scholarship",
    name: "Scholarship Student",
    summary: "You earned a merit award that covers most of your fees.",
    upside: "Lowest fees on campus and a strong academic head start.",
    tradeoff: "The award is reviewed every semester — fall below a 3.00 GPA and it is at risk. Little spending money.",
    statMods: { academicPreparation: 14, careerReadiness: 6, socialConnection: -4, energy: -4 },
    startingWallet: cedis(900),
    firstSemesterFees: cedis(350),
    flags: ["scholarship_active"],
  },
  {
    id: "entrepreneurial",
    name: "Entrepreneurial Student",
    summary: "You sold things all through secondary school and arrive with contacts and a little capital.",
    upside: "Seed money and early business know-how.",
    tradeoff: "Full fees, and your ventures will compete with lectures for your time.",
    statMods: { businessExperience: 14, campusReputation: 6, academicPreparation: -8 },
    startingWallet: cedis(2600),
    firstSemesterFees: cedis(1400),
    flags: ["business_contacts"],
  },
  {
    id: "sports",
    name: "Sports Student",
    summary: "You were your school's standout athlete and the university team has noticed.",
    upside: "High energy and instant recognition around campus.",
    tradeoff: "Training eats into study time, and you start behind academically.",
    statMods: { energy: 10, campusReputation: 6, leadership: 4, academicPreparation: -8 },
    startingWallet: cedis(1500),
    firstSemesterFees: cedis(1100),
    flags: ["athlete"],
  },
  {
    id: "creative",
    name: "Creative Student",
    summary: "Design, music, film — you make things, and people remember them.",
    upside: "A wide social circle and a portfolio employers can see.",
    tradeoff: "Modest funds, and no head start on the business side of creative work.",
    statMods: { socialConnection: 10, careerReadiness: 6, wellbeing: 4, businessExperience: -4, leadership: -4 },
    startingWallet: cedis(1400),
    firstSemesterFees: cedis(1200),
    flags: ["creative_portfolio"],
  },
  {
    id: "undecided",
    name: "Undecided Student",
    summary: "You are not sure yet who you want to become — and that leaves every door open.",
    upside: "Balanced start and extra career-exploration opportunities.",
    tradeoff: "No standout strength in first year.",
    statMods: { wellbeing: 6, socialConnection: 5, academicPreparation: 5, careerReadiness: 4, campusReputation: -4, leadership: -4 },
    startingWallet: cedis(1700),
    firstSemesterFees: cedis(1200),
    flags: ["explorer"],
  },
];

export const BASE_STATS: Record<StatKey, number> = {
  academicPreparation: 40,
  energy: 75,
  wellbeing: 70,
  socialConnection: 30,
  campusReputation: 10,
  careerReadiness: 10,
  leadership: 10,
  businessExperience: 5,
};

// Narrative flavour only. These never change stats or outcomes.
export const HOMETOWNS = ["Accra", "Kumasi", "Tamale", "Cape Coast", "Takoradi", "Ho", "Sunyani", "Koforidua", "Bolgatanga", "Wa", "Techiman", "Tema"] as const;
export const AMBITIONS = [
  { id: "top-of-class", label: "Graduate at the top of my class" },
  { id: "own-business", label: "Leave with a business that works" },
  { id: "serve-community", label: "Change something in my community" },
  { id: "lead", label: "Lead people well" },
  { id: "create", label: "Make work people remember" },
  { id: "find-my-path", label: "Figure out what I truly want" },
] as const;
export const TRAITS = ["Curious", "Outgoing", "Careful", "Ambitious", "Easygoing", "Loyal", "Witty", "Determined"] as const;
export const MAX_TRAITS = 2;

export const APPEARANCE = {
  skinTone: ["#5b3a29", "#70452f", "#8a5a3c", "#a26f4a", "#3f2a1e", "#c08a5f"],
  hairstyle: ["low-cut", "afro", "braids", "locs", "puff", "fade", "cornrows", "headwrap"],
  hairColor: ["#17120f", "#3a2418", "#6b3f22", "#8c2f39"],
  outfit: ["kente-trim-shirt", "campus-hoodie", "smock", "print-dress", "polo", "blazer"],
  outfitColor: ["#c8553d", "#1f7a6d", "#e0a526", "#3d5a99", "#7a3e8e", "#2b2b2b"],
  accessory: ["none", "glasses", "headphones", "beads", "cap"],
} as const;
