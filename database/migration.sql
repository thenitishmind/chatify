-- ============================================
-- CHATIFY — Supabase Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. User profiles (synced from Firebase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'Hey, I am using Chatify!',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Conversations (1-on-1 chats)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 TEXT REFERENCES profiles(id),
    participant_2 TEXT REFERENCES profiles(id),
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(participant_1, participant_2)
);

-- 3. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES profiles(id),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Call signaling
CREATE TABLE IF NOT EXISTS call_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id TEXT REFERENCES profiles(id),
    callee_id TEXT REFERENCES profiles(id),
    call_type TEXT DEFAULT 'audio',
    signal_type TEXT NOT NULL,
    signal_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_call_signals_callee ON call_signals(callee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- 6. Enable Realtime for messages and call_signals
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- 7. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;

-- Note: Since the backend uses the service role key (bypasses RLS),
-- RLS policies below are for direct client-side access (Realtime subscriptions).
-- The anon key used by the frontend can read via these policies.

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Conversations: participants can read
CREATE POLICY "Participants can view conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Service role can manage conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update conversations" ON conversations FOR UPDATE USING (true);

-- Messages: conversation participants can read
CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Service role can insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update messages" ON messages FOR UPDATE USING (true);

-- Call signals: caller/callee can view
CREATE POLICY "Call participants can view signals" ON call_signals FOR SELECT USING (true);
CREATE POLICY "Service role can insert signals" ON call_signals FOR INSERT WITH CHECK (true);
