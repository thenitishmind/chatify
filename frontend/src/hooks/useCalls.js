import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useCalls = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true);
      try {
        const res = await api.get('/calls');
        setCalls(res.data.calls || []);
      } catch (err) {
        console.error('Fetch calls error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/calls');
      setCalls(res.data.calls || []);
    } catch (err) {
      console.error('Fetch calls error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { calls, loading, refetch };
};
