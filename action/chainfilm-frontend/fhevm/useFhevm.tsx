"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createFhevmInstance } from "./internal/fhevm";

export type FhevmGoState = "idle" | "loading" | "ready" | "error";

export function useFhevm(parameters: {
  provider: any;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}) {
  const { provider, chainId, enabled = true } = parameters;
  const [instance, setInstance] = useState<any>();
  const [status, setStatus] = useState<FhevmGoState>("idle");
  const [error, setError] = useState<Error | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setInstance(undefined);
    setError(undefined);
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (!enabled || !provider) return;
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading");
        const inst = await createFhevmInstance({ provider, chainId });
        if (!cancelled) {
          setInstance(inst);
          setStatus("ready");
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e);
          setStatus("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [provider, chainId, enabled]);

  return { instance, status, error, refresh } as const;
}






