import { useState, useEffect } from 'react';
import { getDashboardStats, getDashboardCharts } from '@/services/dashboard';

export const useDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [statsRes, chartsRes] = await Promise.all([
          getDashboardStats(),
          getDashboardCharts()
        ]);
        setStats(statsRes.data);
        setCharts(chartsRes.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { stats, charts, loading, error };
};