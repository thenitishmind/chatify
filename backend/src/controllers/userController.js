const supabase = require('../config/supabase');

/** GET /api/users/search?q=username */
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });

    const { data, error } = await supabase.from('profiles')
      .select('id, display_name, username, avatar_url, is_online, status, bio')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq('id', req.user.uid)
      .limit(20);
    if (error) throw error;
    res.json({ users: data || [] });
  } catch (error) { next(error); }
};

/** GET /api/users/:id */
const getUser = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('profiles')
      .select('id, display_name, username, avatar_url, is_online, last_seen, status, bio, created_at')
      .eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ user: data });
  } catch (error) { next(error); }
};

/** GET /api/users/me */
const getMe = async (req, res, next) => {
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', req.user.uid).single();
    res.json({ user: data });
  } catch (error) { next(error); }
};

module.exports = { searchUsers, getUser, getMe };
