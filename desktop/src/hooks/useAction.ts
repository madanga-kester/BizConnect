import { useState } from "react";
import type { ApiResult } from "../api";

export type Status = { kind: "loading" | "error" | "success"; message: string };

export function useAction() {
  const [status, setStatus] = useState<Status | null>(null);
  const run = async <T>(task: () => Promise<ApiResult<T>>, success = "Saved") => {
    setStatus({ kind: "loading", message: "Working…" });
    const r = await task();
    setStatus(r.ok ? { kind: "success", message: success } : { kind: "error", message: r.message });
    return r;
  };
  return { status, setStatus, run };
}
