import { useState, useEffect } from 'react';
import { getJournalEntries, getJournalEntryById, createJournalEntry, updateJournalEntry, deleteJournalEntry, postJournalEntry } from '@/services/journal-entries';

export const useJournalEntries = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      try {
        const response = await getJournalEntries();
        setEntries(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error loading journal entries');
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  return { data: entries, loading, error };
};