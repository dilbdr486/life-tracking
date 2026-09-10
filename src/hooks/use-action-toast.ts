"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";

type ActionState = {
  error?: string;
  success?: string;
};

export function useActionToast(state: ActionState, pending: boolean) {
  const toast = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (state.error) toast.error(state.error);
      else if (state.success) toast.success(state.success);
    }
    wasPending.current = pending;
  }, [pending, state.error, state.success, toast]);
}
