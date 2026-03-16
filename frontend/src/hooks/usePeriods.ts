import { useState, useEffect } from 'react';
import { getPeriods, getPeriodById, createPeriod, updatePeriod, deletePeriod } from '@/services/periods';

export const usePeriods = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPeriods = async () => {
      setLoading(true);
      try {
        const response = await getPeriods();
        setPeriods(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error loading periods');
      } finally {
        setLoading(false);
      }
    };

    loadPeriods();
  }, []);

  return { data: periods, loading, error };
};