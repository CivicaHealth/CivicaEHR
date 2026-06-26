import { useEffect, useRef, type RefObject } from 'react';

/**
 * Resets the form once `state` transitions to a no-error result after the
 * initial render -- i.e. after a successful submission.
 */
export function useResetOnSuccess(formRef: RefObject<HTMLFormElement | null>, state: { error?: string }) {
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!state.error) {
      formRef.current?.reset();
    }
  }, [state, formRef]);
}
