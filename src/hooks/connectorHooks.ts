import { useState } from 'react';
import useSWR from 'swr';
import type { ConnectorName } from '@/connectors/names';
import { api, fetcher } from '@/lib/api';

export const useConnectorTest = (type: ConnectorName) => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const test = async (cfg: any) => {
    setStatus('testing');
    try {
      await api.post(`/connectors/${type}/test`, cfg);
      setStatus('ok');
    } catch (e: any) {
      setStatus('error');
      setError(e.message);
    }
  };
  return { status, error, test };
};

export const useSyncProgress = (connectorId: string) => {
  const { data, error } = useSWR<{ percent: number }>(
    `/connectors/${connectorId}/progress`,
    fetcher,
    { refreshInterval: 1000 }
  );
  if (error) {
    return 0;
  }
  return data?.percent ?? 0;
};
