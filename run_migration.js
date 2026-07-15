const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres.ukmkreqyqiuzxhrmmgnt:%40Takaishvili55@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  });

  await client.connect();
  const sql = fs.readFileSync('prisma/migrations-manual/001_athlete_portal.sql', 'utf8');
  await client.query(sql);
  await client.end();
  console.log('Migration executed successfully');
}

main().catch(console.error);
