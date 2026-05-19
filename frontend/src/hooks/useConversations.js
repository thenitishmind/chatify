import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import supabase from '../services/supabase';

/**
 * Hook for managing conversations
 * Fetches via backend API, subscribes to realtime updates
 */
export const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/conversations');
      setConversations(res.data.conversations || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for conversation updates (new messages update last_message)
  useEffect(() => {
    const channel = supabase
      .channel('conversations-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        // Refetch to get updated last_message and other_user
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  // Create or find a conversation with another user
  const createConversation = useCallback(async (participantId) => {
    try {
      const res = await api.post('/conversations', { participant_id: participantId });
      const newConv = res.data.conversation;
      setConversations(prev => {
        if (prev.find(c => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
      return newConv;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create conversation');
      throw err;
    }
  }, []);

  return { conversations, loading, error, createConversation, refetch: fetchConversations };
};
