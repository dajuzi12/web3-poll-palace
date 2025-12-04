import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeFHE, getFheInstance, resetFheInstance } from '@/utils/fhe';

interface UseFHEResult {
  fhe: any;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * React Hook to manage FHE instance
 * Handles initialization, network changes, and cleanup
 */
export function useFHE(): UseFHEResult {
  const [fhe, setFhe] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use ref to store AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    // 1. Abort previous async operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Immediately clear instance
    setFhe(null);
    setIsInitialized(false);
    setError(null);

    // 3. Reset global instance
    resetFheInstance();

    // 4. Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // 5. Start initialization
    setIsLoading(true);

    initializeFHE()
      .then((instance) => {
        // Check if aborted
        if (signal.aborted) {
          console.log('[useFHE] Initialization aborted');
          return;
        }
        setFhe(instance);
        setIsInitialized(true);
        setError(null);
      })
      .catch((err: any) => {
        if (signal.aborted) {
          console.log('[useFHE] Error handling aborted');
          return;
        }
        setError(err.message);
        console.error('[useFHE] Initialization error:', err);
      })
      .finally(() => {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    async function init() {
      // Check if already initialized
      const existingInstance = getFheInstance();
      if (existingInstance) {
        setFhe(existingInstance);
        setIsInitialized(true);
        return;
      }

      setIsLoading(true);
      try {
        const instance = await initializeFHE();
        setFhe(instance);
        setIsInitialized(true);
      } catch (err: any) {
        setError(err.message);
        console.error('[useFHE] Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Listen for network changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleChainChanged = () => {
      console.log('[useFHE] Network changed, refreshing FHE instance...');
      refresh();
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        console.log('[useFHE] Wallet disconnected, resetting FHE instance...');
        resetFheInstance();
        setFhe(null);
        setIsInitialized(false);
      } else {
        console.log('[useFHE] Account changed, refreshing FHE instance...');
        refresh();
      }
    };

    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [refresh]);

  return {
    fhe,
    isInitialized,
    isLoading,
    error,
    refresh
  };
}
