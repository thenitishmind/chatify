const supabase = require('../config/supabase');

/** GET /api/conversations */
const getConversations = async (req, res, next) => {
  try {
    const { uid } = req.user;

    // Get 1-on-1 conversations
    const { data: direct } = await supabase.from('conversations').select('*')
      .eq('is_group', false)
      .or(`participant_1.eq.${uid},participant_2.eq.${uid}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    // Get group conversations
    const { data: groups } = await supabase.from('conversations').select('*')
      .eq('is_group', true).contains('participants', [uid])
      .order('last_message_at', { ascending: false, nullsFirst: false });

    const allConvs = [...(direct || []), ...(groups || [])].sort((a, b) =>
      new Date(b.last_message_at || b.created_at) - new Date(a.last_message_at || a.created_at)
    );

    const enriched = await Promise.all(allConvs.map(async (conv) => {
      if (conv.is_group) {
        const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', conv.id);
        return { ...conv, member_count: members?.length || 0 };
      }
      const otherUserId = conv.participant_1 === uid ? conv.participant_2 : conv.participant_1;
      const { data: profile } = await supabase.from('profiles')
        .select('id, display_name, username, avatar_url, is_online, last_seen, status').eq('id', otherUserId).single();
      return { ...conv, other_user: profile };
    }));

    res.json({ conversations: enriched });
  } catch (error) { next(error); }
};

/** POST /api/conversations */
const createConversation = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { participant_id } = req.body;
    if (!participant_id || participant_id === uid) return res.status(400).json({ error: 'Invalid participant' });

    const [p1, p2] = [uid, participant_id].sort();
    const { data: existing } = await supabase.from('conversations').select('*').eq('participant_1', p1).eq('participant_2', p2).single();

    if (existing) {
      const { data: profile } = await supabase.from('profiles')
        .select('id, display_name, username, avatar_url, is_online, last_seen, status').eq('id', participant_id).single();
      return res.json({ conversation: { ...existing, other_user: profile }, isNew: false });
    }

    const { data, error } = await supabase.from('conversations').insert({ participant_1: p1, participant_2: p2 }).select().single();
    if (error) throw error;

    const { data: profile } = await supabase.from('profiles')
      .select('id, display_name, username, avatar_url, is_online, last_seen, status').eq('id', participant_id).single();
    res.status(201).json({ conversation: { ...data, other_user: profile }, isNew: true });
  } catch (error) { next(error); }
};

/** POST /api/conversations/group */
const createGroup = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { name, participant_ids = [] } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Group name required' });

    const allParticipants = [uid, ...participant_ids.filter(id => id !== uid)];
    if (allParticipants.length < 2) return res.status(400).json({ error: 'Need at least 2 participants' });

    // Handle avatar upload
    let group_avatar = null;
    if (req.file) {
      const ext = req.file.originalname.split('.').pop();
      const fileName = `groups/${Date.now()}.${ext}`;
      await supabase.storage.from('avatars').upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      group_avatar = urlData.publicUrl;
    }

    const { data: conv, error } = await supabase.from('conversations').insert({
      is_group: true, group_name: name.trim(), group_avatar, group_admin: uid, participants: allParticipants
    }).select().single();
    if (error) throw error;

    // Insert group members
    const members = allParticipants.map(id => ({ group_id: conv.id, user_id: id, role: id === uid ? 'admin' : 'member' }));
    await supabase.from('group_members').insert(members);

    res.status(201).json({ conversation: conv });
  } catch (error) { next(error); }
};

module.exports = { getConversations, createConversation, createGroup };
