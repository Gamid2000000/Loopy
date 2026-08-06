import { useEffect, useState } from "react";
import { Input } from "../../ui/Input";

export function CardSearchInput({ query, onSearch }: { query: string; onSearch: (query: string) => void }) {
  const [value, setValue] = useState(query);

  useEffect(() => {
    if (value === query) return;
    const timer = window.setTimeout(() => onSearch(value), 350);
    return () => window.clearTimeout(timer);
  }, [onSearch, query, value]);

  return (
    <div>
      <Input
        label="Поиск по карточкам"
        placeholder="Поиск по карточкам"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSearch(value);
        }}
      />
      {value && (
        <button type="button" onClick={() => setValue("")} aria-label="Очистить поиск">
          Очистить
        </button>
      )}
    </div>
  );
}
