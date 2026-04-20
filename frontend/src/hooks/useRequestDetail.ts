import { startTransition, useEffect, useEffectEvent, useState } from 'react';
import { api, type PaymentRequest } from '../lib/api';

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Request details could not be loaded';
}

export function useRequestDetail(requestId: string | undefined, enabled: boolean) {
  const [data, setData] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchDetail = useEffectEvent(async () => {
    if (!enabled || !requestId) {
      setData(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getRequest(requestId);
      setData(response);
    } catch (detailError) {
      setError(getMessage(detailError));
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    startTransition(() => {
      void fetchDetail();
    });
  }, [enabled, requestId, refreshIndex]);

  function refresh() {
    setRefreshIndex((value) => value + 1);
  }

  return {
    data,
    error,
    isLoading,
    refresh,
  };
}
