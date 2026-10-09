export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  /** 1 (gentle) to 5 (demanding). Feeds assessment maths from Phase 2. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  prerequisites: string[];
}

export interface Program {
  id: string;
  name: string;
  faculty: string;
  blurb: string;
  /** Course ids for Year 1, Semester 1. Later terms are added in Phase 5. */
  y1s1: string[];
}

const c = (code: string, title: string, credits: number, difficulty: Course["difficulty"]): Course => ({
  id: code.toLowerCase().replace(/\s+/g, "-"),
  code,
  title,
  credits,
  difficulty,
  prerequisites: [],
});

const COURSE_LIST: Course[] = [
  c("AMU 101", "Academic Writing and Communication", 3, 2),
  c("AMU 103", "Critical Thinking and Numeracy", 2, 2),
  c("BUS 111", "Principles of Management", 3, 2),
  c("BUS 113", "Introduction to Business in Ghana", 3, 2),
  c("BUS 115", "Business Mathematics", 3, 3),
  c("CSC 111", "Programming Fundamentals", 3, 4),
  c("CSC 113", "Discrete Structures", 3, 4),
  c("CSC 115", "Computing and Society", 3, 2),
  c("ECO 111", "Principles of Microeconomics", 3, 3),
  c("ECO 113", "Mathematics for Economists I", 3, 4),
  c("ECO 115", "Economy of Ghana", 3, 2),
  c("ACC 111", "Financial Accounting I", 3, 3),
  c("ACC 113", "Business Law Basics", 3, 3),
  c("COM 111", "Introduction to Mass Communication", 3, 2),
  c("COM 113", "Media Writing", 3, 3),
  c("COM 115", "Public Speaking", 3, 2),
  c("PSY 111", "Introduction to Psychology", 3, 2),
  c("PSY 113", "Human Development", 3, 3),
  c("PSY 115", "Statistics for Behavioural Science", 3, 4),
  c("ENG 111", "Engineering Mathematics I", 3, 5),
  c("ENG 113", "Engineering Drawing", 3, 3),
  c("ENG 115", "Applied Physics", 3, 4),
  c("POL 111", "Introduction to Political Science", 3, 2),
  c("POL 113", "Government and Politics in Ghana", 3, 3),
  c("POL 115", "Political Thought", 3, 3),
  c("EDU 111", "Foundations of Education", 3, 2),
  c("EDU 113", "Child and Adolescent Learning", 3, 3),
  c("EDU 115", "Classroom Communication", 3, 2),
];

export const COURSES: Record<string, Course> = Object.fromEntries(COURSE_LIST.map((x) => [x.id, x]));

const CORE = ["amu-101", "amu-103"];
const p = (id: string, name: string, faculty: string, blurb: string, own: string[]): Program => ({
  id,
  name,
  faculty,
  blurb,
  y1s1: [...CORE, ...own],
});

export const PROGRAMS: Program[] = [
  p("business-administration", "Business Administration", "School of Business", "Lead teams, read markets, and learn how organisations really run.", ["bus-111", "bus-113", "bus-115"]),
  p("computer-science", "Computer Science", "School of Computing", "Build software and reason about hard problems.", ["csc-111", "csc-113", "csc-115"]),
  p("economics", "Economics", "School of Social Sciences", "Understand choices, incentives, and how economies grow.", ["eco-111", "eco-113", "eco-115"]),
  p("accounting", "Accounting", "School of Business", "Master the language every business must speak.", ["acc-111", "acc-113", "bus-115"]),
  p("communication-studies", "Communication Studies", "School of Arts and Media", "Tell stories that move audiences across every medium.", ["com-111", "com-113", "com-115"]),
  p("psychology", "Psychology", "School of Social Sciences", "Study how people think, feel, and grow.", ["psy-111", "psy-113", "psy-115"]),
  p("engineering", "Engineering", "School of Engineering", "Design the systems communities depend on.", ["eng-111", "eng-113", "eng-115"]),
  p("political-science", "Political Science", "School of Social Sciences", "Examine power, institutions, and public life.", ["pol-111", "pol-113", "pol-115"]),
  p("education", "Education", "School of Education", "Learn how to help others learn.", ["edu-111", "edu-113", "edu-115"]),
];

export function getProgram(id: string): Program | undefined {
  return PROGRAMS.find((x) => x.id === id);
}
