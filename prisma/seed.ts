import "dotenv/config";
import { COURSES, PROGRAMS } from "../src/engine";
import { db } from "../src/server/db";

/** Mirrors engine reference content into the database. Safe to re-run. */
export async function seedReferenceData() {
  await db.university.upsert({
    where: { id: "amu" },
    update: {},
    create: { id: "amu", name: "Akwaaba Metropolitan University", shortName: "AMU", country: "GH" },
  });
  for (const c of Object.values(COURSES)) {
    const data = { code: c.code, title: c.title, credits: c.credits, difficulty: c.difficulty };
    await db.course.upsert({ where: { id: c.id }, update: data, create: { id: c.id, ...data } });
  }
  for (const p of PROGRAMS) {
    const data = { name: p.name, faculty: p.faculty, universityId: "amu" };
    await db.academicProgram.upsert({ where: { id: p.id }, update: data, create: { id: p.id, ...data } });
    for (const courseId of p.y1s1) {
      await db.programCourse.upsert({
        where: { programId_courseId: { programId: p.id, courseId } },
        update: { year: 1, semester: 1 },
        create: { programId: p.id, courseId, year: 1, semester: 1 },
      });
    }
  }
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seedReferenceData().then(() => { console.log("Seeded AMU reference data."); return db.$disconnect(); });
}
