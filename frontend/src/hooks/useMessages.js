import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import supabase from '../services/supabase';

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;
      setLoading(true);
      try {
        const res = await api.get(`/messages/${conversationId}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Fetch messages error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`msgs:${conversationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [conversationId]);

  const sendMessage = useCallback(async (content) => {
    if (!conversationId || !content?.trim()) return;
    const res = await api.post(`/messages/${conversationId}`, { content });
    setMessages(prev => prev.find(m => m.id === res.data.message.id) ? prev : [...prev, res.data.message]);
    return res.data.message;
  }, [conversationId]);

  const refetch = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/messages/${conversationId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  }, [conversationId]);

  return { messages, loading, sendMessage, refetch };
};
