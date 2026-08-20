/**
 * useApi.js — shared data-fetching utilities for the SIRD Dashboard.
 *
 * Provides central apiFetch(), useQuery() caching hook, cache invalidation,
 * video source resolution, and date-time formatting.
 */

import { useState, useEffect, useCallback } from 'react';

const _cache = new Map();

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(path, token, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useQuery(cacheKey, fetcher, deps = []) {
  const [data, setData] = useState(() => _cache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(!_cache.has(cacheKey));
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      _cache.set(cacheKey, result);
      setData(result);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!_cache.has(cacheKey)) {
      refetch();
    }
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch };
}

export function invalidateCache(...keys) {
  keys.forEach((k) => _cache.delete(k));
}

export function getVideoSource(url) {
  if (!url) return '';
  if (url.startsWith('http://localhost:8000')) {
    return url.replace('http://localhost:8000', API_BASE);
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '';
  try {
    let d = dateInput;
    if (typeof dateInput === 'object' && dateInput !== null) {
      if (dateInput.$date) d = dateInput.$date;
    }
    if (typeof d === 'number') {
      d = new Date(d);
    } else if (typeof d === 'string') {
      if (!d.endsWith('Z') && !d.includes('+') && !d.includes('GMT')) {
        d = d + 'Z';
      }
      d = new Date(d);
    }
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
}
