const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const comps = await prisma.competition.findMany();
  console.log("COMPETITIONS:", comps.map(c => ({ id: c.id, name: c.name, isPublished: c.isPublished })));
  
  const events = await prisma.calendarEvent.findMany();
  console.log("CALENDAR EVENTS:", events.map(e => ({ id: e.id, title: e.title, link: e.link })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
