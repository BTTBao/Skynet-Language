import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:vGoN4hS3W1rBRfei@db.hnbpwepfrsveysleraxf.supabase.co:5432/postgres',
});

async function runSetup() {
  try {
    console.log('Connecting to Supabase Database...');
    await client.connect();

    console.log('Creating Words table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS words (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,  -- Supabase Auth ID (can act as a reference if tracking per user)
        english VARCHAR(255) NOT NULL,
        vietnamese VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'new', -- e.g., 'new', 'learning', 'learned'
        correct_count INTEGER DEFAULT 0,
        last_tested_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('Words table created or already exists.');
    
    // Create an index on User ID for fast fetching
    await client.query(`
      CREATE INDEX IF NOT EXISTS words_user_id_idx ON words (user_id);
    `);

    // Note: To make standard Supabase interactions work well, we need RLS.
    // However, since we are doing simple integration, we might just disable RLS on words or set open policies
    // If the user wants a personal learning app, each user should only see their words.
    console.log('Setting up Row Level Security (RLS)...');
    
    // Enable RLS
    await client.query(`ALTER TABLE words ENABLE ROW LEVEL SECURITY;`);

    // Policy: Users can select their own words OR if we are not enforcing strict auth yet, let everyone read/write
    // For a fully personal app, we need auth. Yes, user asked "đăng nhập".
    // Wait, "auth.uid()" is Supabase's way.
    await client.query(`
      DROP POLICY IF EXISTS "Users can manage their own words" ON words;
      CREATE POLICY "Users can manage their own words" ON words
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    `);

    console.log('Database setup complete!');
  } catch (err) {
    console.error('Error setting up DB:', err);
  } finally {
    await client.end();
  }
}

runSetup();
