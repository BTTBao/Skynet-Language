-- Copy and paste this into the Supabase SQL Editor to initialize your database!
-- You can find the SQL Editor on the left sidebar of your Supabase Dashboard.

CREATE TABLE IF NOT EXISTS public.words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  english VARCHAR(255) NOT NULL,
  vietnamese VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  correct_count INTEGER DEFAULT 0,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimize queries by user
CREATE INDEX IF NOT EXISTS words_user_id_idx ON public.words (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;

-- Allow users to read, update, insert, delete ONLY their own words
CREATE POLICY "Users can manage their own words" ON public.words
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
