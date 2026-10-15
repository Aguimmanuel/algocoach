import { useEffect, useRef } from "react";
import { getLearning, putLearning } from "../lib/api";
import { mergeLearning, type LearningState } from "../lib/learning";
export function useLearningSync(
  userId: number | undefined,
  state: LearningState,
  setState: (
    next: LearningState | ((old: LearningState) => LearningState),
  ) => void,
) {
  const current = useRef(state);
  current.current = state;
  const ready = useRef<number | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    ready.current = undefined;
    if (userId)
      getLearning()
        .then((server) => {
          if (!alive) return;
          const merged = mergeLearning(current.current, server);
          ready.current = userId;
          setState(merged);
          void putLearning(merged).catch(() => {});
        })
        .catch(() => {
          /* retain local state; retry hydration next sign-in */
        });
    return () => {
      alive = false;
      ready.current = undefined;
    };
  }, [userId, setState]);
  useEffect(() => {
    if (!userId || ready.current !== userId) return;
    const timer = setTimeout(() => {
      void putLearning(current.current).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [state, userId]);
}
