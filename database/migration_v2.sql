-- ============================================
-- CHATIFY v2 — Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Update profiles: add username, email, bio; make phone nullable
ALTER TABLE profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 2. Update messages: add media, deletion support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for TEXT[] DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN DEFAULT false;
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- 3. Update conversations: add group support
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_avatar TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_admin TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participants TEXT[] DEFAULT '{}';

-- 4. Status stories (24-hour expiry)
CREATE TABLE IF NOT EXISTS status_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    caption TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);
CREATE INDEX IF NOT EXISTS idx_status_user ON status_stories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_expires ON status_stories(expires_at);

-- 5. Call history
CREATE TABLE IF NOT EXISTS call_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    caller_id TEXT REFERENCES profiles(id),
    callee_id TEXT REFERENCES profiles(id),
    call_type TEXT DEFAULT 'audio',
    status TEXT DEFAULT 'missed',
    duration INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON call_history(caller_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON call_history(callee_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_conv ON call_history(conversation_id);

-- 6. Group members
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- 7. Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE status_stories;
ALTER PUBLICATION supabase_realtime ADD TABLE call_history;

-- 8. RLS for new tables
ALTER TABLE status_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view statuses" ON status_stories FOR SELECT USING (true);
CREATE POLICY "Service can insert statuses" ON status_stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can delete statuses" ON status_stories FOR DELETE USING (true);

CREATE POLICY "Anyone can view call history" ON call_history FOR SELECT USING (true);
CREATE POLICY "Service can insert calls" ON call_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update calls" ON call_history FOR UPDATE USING (true);

CREATE POLICY "Anyone can view group members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Service can manage group members" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can remove group members" ON group_members FOR DELETE USING (true);

-- 9. RLS for message deletion
CREATE POLICY "Service can delete messages" ON messages FOR DELETE USING (true);

-- 10. Create storage buckets (run these separately or create via dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('statuses', 'statuses', true);
