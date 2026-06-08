import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const { Client } = pg

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env')
  console.error('Get it from Supabase Dashboard → Settings → Database → Connection string (URI)')
  console.error('Add to .env: DATABASE_URL=postgresql://postgres.[ref]:[password]@...')
  process.exit(1)
}

const schemaPath = resolve(__dirname, '../supabase/schema.sql')
const sql = readFileSync(schemaPath, 'utf-8')

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

try {
  console.log('Connecting to Supabase database...')
  await client.connect()
  console.log('Running migration...')
  await client.query(sql)
  console.log('Migration completed successfully!')
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
