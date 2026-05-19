const supabase = require('../config/supabase');

/** POST /api/auth/verify — Sync Google user to Supabase */
const verifyAndSync = async (req, res, next) => {
  try {
    const { uid, email } = req.user;
    const { display_name, avatar_url } = req.body;

    const { data: existing } = await supabase
      .from('profiles').select('*').eq('id', uid).single();

    if (existing) {
      const updates = { is_online: true, last_seen: new Date().toISOString() };
      if (!existing.avatar_url && avatar_url) updates.avatar_url = avatar_url;
      await supabase.from('profiles').update(updates).eq('id', uid);
      // User is new if they don't have a username set yet
      const isNewUser = !existing.username;
      return res.json({ user: { ...existing, ...updates }, isNewUser });
    }

    const newProfile = {
      id: uid, email: email || null, phone: null,
      display_name: display_name || email?.split('@')[0] || 'New User',
      username: null, avatar_url: avatar_url || null, bio: '',
      status: 'Hey, I am using Chatify!',
      is_online: true, last_seen: new Date().toISOString()
    };

    const { data, error } = await supabase.from('profiles').insert(newProfile).select().single();
    if (error) throw error;
    res.status(201).json({ user: data, isNewUser: true });
  } catch (error) { next(error); }
};

/** PUT /api/auth/profile */
const updateProfile = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { display_name, avatar_url, status, bio, username } = req.body;
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (status !== undefined) updates.status = status;
    if (bio !== undefined) updates.bio = bio;
    if (username !== undefined) updates.username = username;

    const { data, error } = await supabase.from('profiles').update(updates).eq('id', uid).select().single();
    if (error) throw error;
    res.json({ user: data });
  } catch (error) { next(error); }
};

/** GET /api/auth/check-username/:username */
const checkUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!username || username.length < 3) return res.json({ available: false, message: 'Min 3 characters' });
    if (!/^[a-z0-9_]+$/.test(username)) return res.json({ available: false, message: 'Only lowercase letters, numbers, underscores' });

    const { data } = await supabase.from('profiles').select('id').eq('username', username).single();
    // If data exists AND it's not the current user
    const isSelf = data?.id === req.user.uid;
    res.json({ available: !data || isSelf });
  } catch (error) { next(error); }
};

/** POST /api/auth/avatar — Upload avatar to Supabase Storage */
const uploadAvatar = async (req, res, next) => {
  try {
    const { uid } = req.user;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = req.file.originalname.split('.').pop();
    const fileName = `${uid}/avatar_${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('avatars').upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype, upsert: true
    });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', uid);
    res.json({ avatar_url: urlData.publicUrl });
  } catch (error) { next(error); }
};

/** POST /api/auth/logout */
const logout = async (req, res, next) => {
  try {
    await supabase.from('profiles').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', req.user.uid);
    res.json({ message: 'Logged out' });
  } catch (error) { next(error); }
};

module.exports = { verifyAndSync, updateProfile, checkUsername, uploadAvatar, logout };
