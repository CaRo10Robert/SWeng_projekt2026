import { useEffect } from 'react';

const APP_NAME = 'CampusMarkt HWG LU';

/** Seitentitel für Browser-Tab und Screenreader (WCAG 2.4.2). */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} – ${APP_NAME}`;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}
