import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const listeners = new Set();

const keyFor = (table) => `aplica.${table}`;

async function readTable(table) {
  const raw = await AsyncStorage.getItem(keyFor(table));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeTable(table, items) {
  await AsyncStorage.setItem(keyFor(table), JSON.stringify(items));
}

function notify() {
  listeners.forEach((cb) => cb());
}

export function useQuery(table, filters = {}, orderBy) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const items = await readTable(table);
    let filtered = items;

    if (filters?.status) {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    if (orderBy?.column) {
      filtered = [...filtered].sort((a, b) => {
        const first = a[orderBy.column] || '';
        const second = b[orderBy.column] || '';
        if (first === second) return 0;
        const asc = orderBy.ascending !== false;
        return asc ? (first > second ? 1 : -1) : (first < second ? 1 : -1);
      });
    }

    setData(filtered);
    setLoading(false);
  }, [table, filters?.status, orderBy?.column, orderBy?.ascending]);

  useEffect(() => {
    refetch();
    listeners.add(refetch);
    return () => listeners.delete(refetch);
  }, [refetch]);

  return { data, loading, refetch };
}

export function useMutation(table, type) {
  const mutate = useCallback(
    async (payload) => {
      const items = await readTable(table);

      if (type === 'insert') {
        const item = {
          ...payload,
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        };
        await writeTable(table, [item, ...items]);
        notify();
        return item;
      }

      if (type === 'update') {
        const { id, data } = payload;
        const nextItems = items.map((item) => (item.id === id ? { ...item, ...data } : item));
        await writeTable(table, nextItems);
        notify();
        return { id, data };
      }

      if (type === 'delete') {
        const { id } = payload;
        const nextItems = items.filter((item) => item.id !== id);
        await writeTable(table, nextItems);
        notify();
        return { id };
      }

      throw new Error('Mutação não suportada');
    },
    [table, type]
  );

  return { mutate };
}
