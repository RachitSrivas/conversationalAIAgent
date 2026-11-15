import { memoryStore } from '../src/lib/memory/memory-store';

console.log('🌱 Seeding minimy benchmark evaluation datasets...');
memoryStore.seedBenchmark();
const sessions = memoryStore.getSessions();

console.log(`✅ Successfully seeded ${sessions.length} benchmark conversation threads:`);
for (const s of sessions) {
  console.log(`  - [${s.simulatedDate || 'Live'}] ${s.title} (${s.id})`);
}
console.log('\nYou can now test queries like:');
console.log('  1. "On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?"');
console.log('  2. "What did I ask you on 3 November? Is your answer still correct today?"');
console.log('  3. "Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"');
