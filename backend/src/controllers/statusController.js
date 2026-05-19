const supabase = require('../config/supabase');

/** POST /api/status — Upload a status (24hr) */
const postStatus = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { caption } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Image required' });

    const ext = req.file.originalname.split('.').pop();
    const fileName = `${uid}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('statuses').upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype
    });
    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from('statuses').getPublicUrl(fileName);
    const { data, error } = await supabase.from('status_stories').insert({
      user_id: uid, media_url: urlData.publicUrl, caption: caption || ''
    }).select().single();
    if (error) throw error;

    res.status(201).json({ status: data });
  } catch (error) { next(error); }
};

/** GET /api/status — Get all active statuses */
const getStatuses = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('status_stories')
      .select('*, profiles:user_id(id, display_name, username, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Group by user
    const grouped = {};
    (data || []).forEach(s => {
      if (!grouped[s.user_id]) grouped[s.user_id] = { user: s.profiles, stories: [] };
      grouped[s.user_id].stories.push(s);
    });

    res.json({ statuses: Object.values(grouped) });
  } catch (error) { next(error); }
};

/** DELETE /api/status/:id */
const deleteStatus = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { data: status } = await supabase.from('status_stories').select('*').eq('id', req.params.id).single();
    if (!status || status.user_id !== uid) return res.status(403).json({ error: 'Unauthorized' });

    await supabase.from('status_stories').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
};

module.exports = { postStatus, getStatuses, deleteStatus };
