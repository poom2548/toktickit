import { getPrisma } from "../src/prisma.js";

// ย้าย prisma มาประกาศข้างนอก เพื่อให้ใช้ instance ตัวเดียวกันตลอดตามที่เพื่อนแนะนำ
const prisma = getPrisma(); 

async function main() {
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network"
  ];

  console.log("Start seeding categories...");

  // วนลูป upsert พร้อมใส่ await ให้ทำงานทีละรายการ
  for (const catName of categories) {
    await prisma.category.upsert({
      where: { name: catName },
      update: {}, 
      create: { name: catName },
    });
    console.log(`✅ Upserted category: ${catName}`);
  }

  console.log("Seeding finished successfully. 🎉");
}

main()
  .catch((e) => {
    // เพิ่มการจัดการ Error (Error handling) ตามที่เพื่อนแนะนำ
    console.error("❌ Error during seeding:", e); 
    process.exit(1);
  })
  .finally(async () => {
    // ปิดการเชื่อมต่อด้วย instance ตัวเดิม
    await prisma.$disconnect(); 
  });
