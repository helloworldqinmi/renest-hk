"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultPreference, furnitureInventory, interpretedConstraints } from "@/lib/demo-data";
import type { LayoutPlan } from "@/types";

interface DemoState {
  selectedFurniture: string[];
  priorityFurniture: string[];
  selectedPreferences: string[];
  naturalLanguagePreference: string;
  constraints: string[];
  selectedLayout: LayoutPlan["id"];
  selectedProduct: string | null;
  listingReady: boolean;
  scanStatus: { old: "idle" | "scanning" | "complete"; new: "idle" | "scanning" | "complete" };
}

interface DemoContextValue extends DemoState {
  toggleFurniture: (id: string) => void;
  togglePriority: (id: string) => void;
  togglePreference: (preference: string) => void;
  setNaturalLanguagePreference: (value: string) => void;
  interpretPreferences: () => void;
  selectLayout: (id: DemoState["selectedLayout"]) => void;
  selectProduct: (id: string) => void;
  setListingReady: (value: boolean) => void;
  setScanStatus: (kind: "old" | "new", status: DemoState["scanStatus"]["old"]) => void;
  resetDemo: () => void;
}

const defaultState: DemoState = {
  selectedFurniture: furnitureInventory.map((item) => item.id),
  priorityFurniture: ["bed", "desk", "wardrobe"],
  selectedPreferences: ["Reuse more furniture", "Work from home", "More open space"],
  naturalLanguagePreference: defaultPreference,
  constraints: [],
  selectedLayout: "reuse",
  selectedProduct: null,
  listingReady: false,
  scanStatus: { old: "idle", new: "idle" },
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("renest-demo");
    if (saved) {
      try {
        setState({ ...defaultState, ...(JSON.parse(saved) as Partial<DemoState>) });
      } catch {
        window.localStorage.removeItem("renest-demo");
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("renest-demo", JSON.stringify(state));
  }, [hydrated, state]);

  const toggleInList = useCallback((key: "selectedFurniture" | "priorityFurniture" | "selectedPreferences", value: string) => {
    setState((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }));
  }, []);

  const value = useMemo<DemoContextValue>(() => ({
    ...state,
    toggleFurniture: (id) => toggleInList("selectedFurniture", id),
    togglePriority: (id) => toggleInList("priorityFurniture", id),
    togglePreference: (preference) => toggleInList("selectedPreferences", preference),
    setNaturalLanguagePreference: (naturalLanguagePreference) => setState((current) => ({ ...current, naturalLanguagePreference })),
    interpretPreferences: () => setState((current) => ({ ...current, constraints: interpretedConstraints })),
    selectLayout: (selectedLayout) => setState((current) => ({ ...current, selectedLayout })),
    selectProduct: (selectedProduct) => setState((current) => ({ ...current, selectedProduct })),
    setListingReady: (listingReady) => setState((current) => ({ ...current, listingReady })),
    setScanStatus: (kind, status) => setState((current) => ({ ...current, scanStatus: { ...current.scanStatus, [kind]: status } })),
    resetDemo: () => {
      setState(defaultState);
      window.localStorage.removeItem("renest-demo");
    },
  }), [state, toggleInList]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider");
  return context;
}
