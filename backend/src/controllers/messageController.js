const supabase = require('../config/supabase');

/** GET /api/messages/:conversationId */
const getMessages = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const { data: conv } = await supabase.from('conversations').select('*').eq('id', conversationId)
      .or(`participant_1.eq.${uid},participant_2.eq.${uid},participants.cs.{${uid}}`).single();
    if (!conv) return res.status(403).json({ error: 'Not a member' });

    const { data, error } = await supabase.from('messages').select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;

    // Filter out deleted messages
    const filtered = (data || []).filter(m => {
      if (m.deleted_for_everyone) return true; // show "deleted" placeholder
      if (m.deleted_for?.includes(uid)) return false;
      return true;
    }).reverse();

    // Mark unread
    await supabase.from('messages').update({ is_read: true })
      .eq('conversation_id', conversationId).neq('sender_id', uid).eq('is_read', false);

    res.json({ messages: filtered });
  } catch (error) { next(error); }
};

/** POST /api/messages/:conversationId — Send text or image */
const sendMessage = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { conversationId } = req.params;
    const { content, message_type = 'text' } = req.body;

    const { data: conv } = await supabase.from('conversations').select('*').eq('id', conversationId)
      .or(`participant_1.eq.${uid},participant_2.eq.${uid},participants.cs.{${uid}}`).single();
    if (!conv) return res.status(403).json({ error: 'Not a member' });

    // Handle image upload
    let media_url = null, media_type = null;
    if (req.file) {
      const ext = req.file.originalname.split('.').pop();
      const fileName = `${conversationId}/${Date.now()}_${uid}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('media').upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype, upsert: false
      });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
      media_url = urlData.publicUrl;
      media_type = req.file.mimetype.startsWith('image') ? 'image' : 'file';
    }

    const msgData = {
      conversation_id: conversationId, sender_id: uid,
      content: content?.trim() || null,
      message_type: media_url ? 'image' : message_type,
      media_url, media_type
    };

    const { data: message, error } = await supabase.from('messages').insert(msgData).select().single();
    if (error) throw error;

    const preview = media_url ? '📷 Photo' : (content?.trim()?.substring(0, 100) || '');
    await supabase.from('conversations').update({ last_message: preview, last_message_at: message.created_at }).eq('id', conversationId);

    res.status(201).json({ message });
  } catch (error) { next(error); }
};

/** DELETE /api/messages/:messageId/for-me */
const deleteForMe = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { messageId } = req.params;

    const { data: msg } = await supabase.from('messages').select('*').eq('id', messageId).single();
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const deleted_for = [...(msg.deleted_for || []), uid];
    await supabase.from('messages').update({ deleted_for }).eq('id', messageId);
    res.json({ success: true });
  } catch (error) { next(error); }
};

/** DELETE /api/messages/:messageId/for-everyone */
const deleteForEveryone = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { messageId } = req.params;

    const { data: msg } = await supabase.from('messages').select('*').eq('id', messageId).single();
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.sender_id !== uid) return res.status(403).json({ error: 'Can only delete your own messages for everyone' });

    await supabase.from('messages').update({ deleted_for_everyone: true, content: null, media_url: null }).eq('id', messageId);
    res.json({ success: true });
  } catch (error) { next(error); }
};

module.exports = { getMessages, sendMessage, deleteForMe, deleteForEveryone };
