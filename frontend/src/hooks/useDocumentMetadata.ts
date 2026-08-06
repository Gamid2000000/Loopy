import { useEffect } from "react";

export function useDocumentMetadata(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionElement = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionElement?.getAttribute("content") ?? null;
    document.title = title;
    descriptionElement?.setAttribute("content", description);
    return () => {
      document.title = previousTitle;
      if (previousDescription !== null) descriptionElement?.setAttribute("content", previousDescription);
    };
  }, [description, title]);
}
