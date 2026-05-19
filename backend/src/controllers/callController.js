const supabase = require('../config/supabase');

/** POST /api/calls — Log a call */
const logCall = async (req, res, next) => {
  try {
    const { callee_id, call_type, status, duration, conversation_id } = req.body;
    let convId = conversation_id;
    if (!convId && callee_id) {
      const { data: convs } = await supabase.from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${req.user.uid},participant_2.eq.${callee_id}),and(participant_1.eq.${callee_id},participant_2.eq.${req.user.uid})`)
        .single();
      if (convs) convId = convs.id;
    }

    const { data, error } = await supabase.from('call_history').insert({
      caller_id: req.user.uid, callee_id, call_type: call_type || 'audio',
      status: status || 'missed', duration: duration || 0,
      conversation_id: convId, ended_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;

    // Insert system message in conversation
    if (convId) {
      const icon = call_type === 'video' ? '📹' : '📞';
      const statusText = status === 'missed' ? 'Missed call' : status === 'rejected' ? 'Call declined' : `Call · ${formatDuration(duration)}`;
      await supabase.from('messages').insert({
        conversation_id: convId, sender_id: req.user.uid,
        content: `${icon} ${statusText}`, message_type: 'system'
      });
      await supabase.from('conversations').update({
        last_message: `${icon} ${statusText}`, last_message_at: new Date().toISOString()
      }).eq('id', convId);
    }

    res.status(201).json({ call: data });
  } catch (error) { next(error); }
};

/** POST /api/calls/end — Log a call when either side ends it */
const endCall = async (req, res, next) => {
  try {
    const { remote_user_id, call_type, duration, initiated_by_caller } = req.body;
    const current_user_id = req.user.uid;

    if (!remote_user_id || !call_type) {
      return res.status(400).json({ error: 'Missing required fields: remote_user_id, call_type' });
    }

    // Find the conversation between these two users
    let convId = null;
    const { data: convs } = await supabase.from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${current_user_id},participant_2.eq.${remote_user_id}),and(participant_1.eq.${remote_user_id},participant_2.eq.${current_user_id})`)
      .single();
    if (convs) convId = convs.id;

    // Determine who called whom
    // If current user is the one who initiated, they are the caller
    // Otherwise, remote_user_id is the caller
    const caller_id = initiated_by_caller ? current_user_id : remote_user_id;
    const callee_id = initiated_by_caller ? remote_user_id : current_user_id;

    // Check if there's an existing call_history record for this session
    // We'll check if there's a recent call (within last 30 seconds) that hasn't been logged yet
    const { data: existingCalls } = await supabase.from('call_history')
      .select('id')
      .eq('caller_id', caller_id)
      .eq('callee_id', callee_id)
      .eq('conversation_id', convId)
      .gte('created_at', new Date(Date.now() - 30000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    let callRecord;
    
    if (existingCalls && existingCalls.length > 0) {
      // Update existing call record
      const { data: updated, error } = await supabase.from('call_history')
        .update({
          status: duration > 0 ? 'completed' : 'missed',
          duration,
          ended_at: new Date().toISOString()
        })
        .eq('id', existingCalls[0].id)
        .select()
        .single();
      if (error) throw error;
      callRecord = updated;
    } else {
      // Create new call record
      const { data: newCall, error } = await supabase.from('call_history').insert({
        caller_id,
        callee_id,
        call_type,
        status: duration > 0 ? 'completed' : 'missed',
        duration,
        conversation_id: convId,
        ended_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      callRecord = newCall;
    }

    // Insert system message in conversation
    if (convId) {
      const icon = call_type === 'video' ? '📹' : '📞';
      const statusText = duration > 0 ? `Call · ${formatDuration(duration)}` : 'Missed call';
      
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: current_user_id,
        content: `${icon} ${statusText}`,
        message_type: 'system'
      });

      await supabase.from('conversations').update({
        last_message: `${icon} ${statusText}`,
        last_message_at: new Date().toISOString()
      }).eq('id', convId);
    }

    res.status(200).json({ call: callRecord, message: 'Call logged successfully' });
  } catch (error) {
    console.error('Error in endCall:', error);
    next(error);
  }
};

/** GET /api/calls — Get call history */
const getCallHistory = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { data, error } = await supabase.from('call_history').select('*')
      .or(`caller_id.eq.${uid},callee_id.eq.${uid}`)
      .order('created_at', { ascending: false }).limit(50);
    if (error) throw error;

    const enriched = await Promise.all((data || []).map(async (call) => {
      const otherId = call.caller_id === uid ? call.callee_id : call.caller_id;
      const { data: profile } = await supabase.from('profiles')
        .select('id, display_name, username, avatar_url').eq('id', otherId).single();
      return { ...call, other_user: profile, is_outgoing: call.caller_id === uid };
    }));

    res.json({ calls: enriched });
  } catch (error) { next(error); }
};

function formatDuration(sec) {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

module.exports = { logCall, endCall, getCallHistory };
