import { getPrisma } from "../src/prisma.js";

// Issue 3 — seed the four supported categories.
// The four names are: Account and Access, Hardware, Software, Network.
// Requirement: running the seed twice must NOT create duplicates.
// Hint: prisma.category.upsert({ where:{name}, update:{}, create:{name} }).
async function main() {
  const prisma = getPrisma();
  
  // รายชื่อหมวดหมู่ทั้ง 4 หมวดที่ต้องการ
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network"
  ];

  console.log("Start seeding categories...");

  // วนลูปใช้ upsert เพื่อไม่ให้ข้อมูลซ้ำเวลารันหลายรอบ
  for (const catName of categories) {
    await prisma.category.upsert({
      where: { name: catName },
      update: {}, 
      create: { name: catName },
    });
    console.log(`Upserted category: ${catName}`);
  }

  console.log("Seeding finished. ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
