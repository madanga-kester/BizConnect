import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useNavigation } from "expo-router";

interface BeforeRemoveEvent {
  preventDefault: () => void;
  data: { action: unknown };
}

interface GuardNavigation {
  addListener: (name: "beforeRemove", callback: (event: BeforeRemoveEvent) => void) => () => void;
  dispatch: (action: unknown) => void;
}

/** Stops accidental route loss for local forms without persisting incomplete listing data. */
export function useUnsavedChanges(snapshotKey: string) {
  const navigation = useNavigation() as unknown as GuardNavigation;
  const savedKey = useRef(snapshotKey);
  const snapshotRef = useRef(snapshotKey);
  snapshotRef.current = snapshotKey;
  const pendingAction = useRef<unknown>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const isDirty = snapshotKey !== savedKey.current;

  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (snapshotKey === savedKey.current) return;
    event.preventDefault();
    pendingAction.current = event.data.action;
    setConfirmVisible(true);
  }), [navigation, snapshotKey]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const guard = (event: BeforeUnloadEvent) => {
      if (snapshotKey === savedKey.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [snapshotKey]);

  const markSaved = useCallback((savedSnapshotKey?: string) => { savedKey.current = savedSnapshotKey ?? snapshotRef.current; }, []);
  const discardAndLeave = useCallback(() => {
    savedKey.current = snapshotKey;
    const action = pendingAction.current;
    pendingAction.current = null;
    setConfirmVisible(false);
    if (action) navigation.dispatch(action);
  }, [navigation]);
  const stay = useCallback(() => { pendingAction.current = null; setConfirmVisible(false); }, []);

  return { isDirty, confirmVisible, markSaved, discardAndLeave, stay };
}
