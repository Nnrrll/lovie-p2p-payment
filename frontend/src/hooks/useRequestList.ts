import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
} from 'react';
import {
  api,
  type PaginatedPaymentRequests,
  type PaymentRequest,
  type PaymentRequestStatus,
} from '../lib/api';

export type RequestDirection = 'incoming' | 'outgoing';
export type RequestFilter = 'ALL' | PaymentRequestStatus;

const emptyList: PaginatedPaymentRequests = {
  requests: [],
  total: 0,
  page: 1,
  limit: 20,
};

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Request list could not be loaded';
}

export function useRequestList(direction: RequestDirection, enabled: boolean) {
  const [data, setData] = useState<PaginatedPaymentRequests>(emptyList);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RequestFilter>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const deferredSearch = useDeferredValue(search.trim());

  const fetchList = useEffectEvent(async () => {
    if (!enabled) {
      setData(emptyList);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const params = {
        limit: 20,
        page: 1,
        search: deferredSearch || undefined,
        status: status === 'ALL' ? undefined : status,
      };

      const response =
        direction === 'incoming'
          ? await api.getIncoming(params)
          : await api.getOutgoing(params);

      setData(response);
    } catch (fetchError) {
      setError(getMessage(fetchError));
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    startTransition(() => {
      void fetchList();
    });
  }, [direction, enabled, status, deferredSearch, refreshIndex]);

  function refresh() {
    setRefreshIndex((value) => value + 1);
  }

  return {
    error,
    isEmpty: !isLoading && data.requests.length === 0,
    isLoading,
    limit: data.limit,
    page: data.page,
    requests: data.requests as PaymentRequest[],
    refresh,
    search,
    setSearch,
    setStatus,
    status,
    total: data.total,
  };
}
