import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_KEY = 'aplica.tasks';
const listeners = new Set();

async function readTasks() {
  const raw = await AsyncStorage.getItem(DB_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeTasks(tasks) {
  await AsyncStorage.setItem(DB_KEY, JSON.stringify(tasks));
}

function notify() {
  listeners.forEach((cb) => cb());
}

export function useQuery(table, filters = {}, orderBy) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const tasks = await readTasks();
    let filtered = tasks;

    if (table === 'tasks' && filters?.status) {
      filtered = tasks.filter((item) => item.status === filters.status);
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
      if (table !== 'tasks') throw new Error('Tabela não suportada');
      const tasks = await readTasks();

      if (type === 'insert') {
        const item = {
          ...payload,
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        };
        await writeTasks([item, ...tasks]);
        notify();
        return item;
      }

      if (type === 'update') {
        const { id, data } = payload;
        const nextTasks = tasks.map((task) => (task.id === id ? { ...task, ...data } : task));
        await writeTasks(nextTasks);
        notify();
        return { id, data };
      }

      throw new Error('Mutação não suportada');
    },
    [table, type]
  );

  return { mutate };
}
