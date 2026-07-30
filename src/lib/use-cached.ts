import { useCallback, useEffect, useRef, useState } from "react";

type Entry = { data: unknown; ts: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export function invalidateCache(prefix?: string) {
  if (!prefix) return cache.clear();
  for (const k of Array.from(cache.keys())) if (k.startsWith(prefix)) cache.delete(k);
}

export function getCached<T>(key: string): T | undefined {
  return cache.get(key)?.data as T | undefined;
}

/**
 * Stale-while-revalidate data hook: renders cached data instantly on
 * navigation and refreshes in the background, so page switches feel instant.
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { staleTime?: number; enabled?: boolean } = {},
) {
  const { staleTime = 30_000, enabled = true } = options;
  const [data, setData] = useState<T | undefined>(() => getCached<T>(key));
  const [isFetching, setIsFetching] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (force: boolean) => {
      const hit = cache.get(key);
      if (!force && hit && Date.now() - hit.ts < staleTime) {
        setData(hit.data as T);
        return hit.data as T;
      }
      let p = inflight.get(key) as Promise<T> | undefined;
      if (!p || force) {
        p = fetcherRef.current();
        inflight.set(key, p as Promise<unknown>);
      }
      setIsFetching(true);
      try {
        const res = await p;
        cache.set(key, { data: res, ts: Date.now() });
        if (mounted.current) setData(res);
        return res;
      } catch {
        return undefined;
      } finally {
        inflight.delete(key);
        if (mounted.current) setIsFetching(false);
      }
    },
    [key, staleTime],
  );

  useEffect(() => {
    if (!enabled) return;
    setData(getCached<T>(key));
    void run(false);
  }, [key, enabled, run]);

  const refetch = useCallback(() => run(true), [run]);

  return { data, isFetching, refetch, setData };
}
