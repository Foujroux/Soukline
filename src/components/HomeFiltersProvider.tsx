"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { SortOrder } from "@/data/listings";

interface HomeFiltersState {
  sort: SortOrder;
  setSort: (sort: SortOrder) => void;
  wilaya: number | "";
  setWilaya: (wilaya: number | "") => void;
}

const HomeFiltersContext = createContext<HomeFiltersState | null>(null);

export function HomeFiltersProvider({ children }: { children: ReactNode }) {
  const [sort, setSort] = useState<SortOrder>("newest");
  const [wilaya, setWilaya] = useState<number | "">("");

  return (
    <HomeFiltersContext.Provider value={{ sort, setSort, wilaya, setWilaya }}>
      {children}
    </HomeFiltersContext.Provider>
  );
}

export function useHomeFilters() {
  const ctx = useContext(HomeFiltersContext);
  if (!ctx) {
    throw new Error("useHomeFilters must be used within a HomeFiltersProvider");
  }
  return ctx;
}