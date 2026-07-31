import { useCallback, useMemo, useState } from "react";

export function useCardSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const toggleCard = useCallback((id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const selectCurrentPage = useCallback((ids: number[]) => setSelectedIds(new Set(ids)), []);
  const selectedCount = selectedIds.size;
  const stateFor = useCallback(
    (ids: number[]) => ({
      allVisibleSelected: ids.length > 0 && ids.every((id) => selectedIds.has(id)),
      someVisibleSelected: ids.some((id) => selectedIds.has(id)),
    }),
    [selectedIds],
  );
  return useMemo(
    () => ({ selectedIds, selectedCount, toggleCard, clearSelection, selectCurrentPage, isSelected: (id: number) => selectedIds.has(id), stateFor }),
    [clearSelection, selectCurrentPage, selectedCount, selectedIds, stateFor, toggleCard],
  );
}
