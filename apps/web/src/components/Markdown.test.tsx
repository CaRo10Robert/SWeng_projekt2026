import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderApp } from '../test/render';
import { Markdown } from './Markdown';

describe('Markdown ohne HTML (ADR-0015)', () => {
  it('rendert kein eingebettetes HTML und keine Skripte', async () => {
    const { container } = renderApp(
      <Markdown>{'# Titel\n\nText <script>alert(1)</script> und <b onclick="x()">fett</b>\n\n<img src=x onerror=alert(1)>'}</Markdown>,
    );
    await screen.findByRole('heading', { name: 'Titel' });
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toContain('onerror');
  });

  it('entschärft javascript:-Links, externe Links mit noopener, Bilder nur als Alternativtext', async () => {
    const { container } = renderApp(
      <Markdown>{'[böse](javascript:alert(1)) [extern](https://example.org) ![Logo der Hochschule](https://example.org/x.png)'}</Markdown>,
    );
    await screen.findByText('böse');
    const links = [...container.querySelectorAll('a')];
    expect(links.some((a) => (a.getAttribute('href') ?? '').toLowerCase().startsWith('javascript:'))).toBe(false);
    const external = links.find((a) => a.textContent === 'extern')!;
    expect(external.getAttribute('rel')).toContain('noopener');
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('Logo der Hochschule')).toBeTruthy();
  });

  it('Tabellen (GFM) und Überschriften mit stabilen Ankern', async () => {
    const { container } = renderApp(<Markdown>{'## 3. Nur private Angebote\n\n| A | B |\n|---|---|\n| 1 | 2 |'}</Markdown>);
    await screen.findByRole('table');
    expect(container.querySelector('h2')?.id).toBeTruthy();
  });
});
