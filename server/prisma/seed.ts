import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();

async function main() {
  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  console.log("🌱 Seeding categories...");
  for (const catName of categories) {
    await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    });
    console.log(`  ✅ Category: ${catName}`);
  }

  // -------------------------------------------------------------------------
  // Related Systems
  // -------------------------------------------------------------------------
  const relatedSystems = [
    "ERP System",
    "HR Portal",
    "CRM",
    "IT Helpdesk Portal",
    "Email Server",
  ];

  console.log("🌱 Seeding related systems...");
  for (const sysName of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name: sysName },
      update: {},
      create: { name: sysName },
    });
    console.log(`  ✅ RelatedSystem: ${sysName}`);
  }

  // -------------------------------------------------------------------------
  // Requesters (Issue 2 — Dev Requester Context)
  // Exactly 5 requesters: 4 active, 1 inactive.
  // -------------------------------------------------------------------------
  const requesters = [
    { name: "Alice Johnson", email: "alice@example.com",  isActive: true  },
    { name: "Bob Smith",     email: "bob@example.com",    isActive: true  },
    { name: "Carol White",   email: "carol@example.com",  isActive: true  },
    { name: "David Lee",     email: "david@example.com",  isActive: true  },
    { name: "Eve Inactive",  email: "eve@example.com",    isActive: false },
  ];

  console.log("🌱 Seeding requesters...");
  for (const req of requesters) {
    await prisma.requester.upsert({
      where: { email: req.email },
      update: { name: req.name, isActive: req.isActive },
      create: req,
    });
    const label = req.isActive ? "active" : "inactive";
    console.log(`  ✅ Requester [${label}]: ${req.name} <${req.email}>`);
  }

  console.log("\n🎉 Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
