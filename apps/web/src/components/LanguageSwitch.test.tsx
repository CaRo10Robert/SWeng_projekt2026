import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderApp } from '../test/render';
import { LanguageSwitch } from './LanguageSwitch';
import { LOCALE_STORAGE_KEY } from '../i18n';

describe('Sprachwahl (REQ-UX-007, REQ-LEGAL-010)', () => {
  it('speichert erst nach ausdrücklicher Wahl, markiert die aktive Sprache und setzt lang je Schaltfläche', async () => {
    // Browsersprache Deutsch (jsdom meldet sonst en-US)
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE']);
    renderApp(<LanguageSwitch />);
    const de = await screen.findByRole('button', { name: /Deutsch/ });
    const en = screen.getByRole('button', { name: /English/ });
    expect(de.getAttribute('aria-pressed')).toBe('true');
    expect(en.getAttribute('lang')).toBe('en');
    // Vor dem Klick keine Speicherung auf dem Endgerät
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
    fireEvent.click(en);
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    await waitFor(() => expect(screen.getByRole('button', { name: /English/ }).getAttribute('aria-pressed')).toBe('true'));
    expect(screen.getByRole('group').getAttribute('aria-label')).toMatch(/Language|Sprache/);
  });
});
