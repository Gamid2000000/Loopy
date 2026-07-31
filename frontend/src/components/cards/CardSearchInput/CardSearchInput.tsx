import { useEffect, useRef, useState } from "react";
import { Input } from "../../ui/Input";

export function CardSearchInput({ query, onSearch }: { query: string; onSearch: (query: string) => void }) {
  const [value, setValue] = useState(query);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  useEffect(() => setValue(query), [query]);
  useEffect(() => {
    if (value === query) return;
    const timer = window.setTimeout(() => onSearchRef.current(value), 350);
    return () => window.clearTimeout(timer);
  }, [query, value]);
  return (
    <div>
      <Input label="Поиск по карточкам" placeholder="Поиск по карточкам" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onSearchRef.current(value); }} />
      {value && <button type="button" onClick={() => setValue("")} aria-label="Очистить поиск">Очистить</button>}
    </div>
  );
}
