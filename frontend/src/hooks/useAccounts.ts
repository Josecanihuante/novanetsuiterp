import { useState, useEffect } from 'react';
import { getAccounts, getAccountById, createAccount, updateAccount, deleteAccount } from '@/services/accounts';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAccounts = async () => {
      setLoading(true);
      try {
        const response = await getAccounts();
        setAccounts(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error loading accounts');
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  return { data: accounts, loading, error };
};