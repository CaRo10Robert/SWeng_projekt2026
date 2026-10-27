import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './ui';

describe('Button (WCAG 2.4.3)', () => {
  it('bleibt während busy fokussierbar und ignoriert Klicks', () => {
    const onClick = vi.fn();
    render(
      <Button busy onClick={onClick}>
        Speichern
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Speichern/ });
    expect(button).toHaveProperty('disabled', false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('löst ohne busy aus und ist standardmäßig type=button', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Senden</Button>);
    const button = screen.getByRole('button', { name: 'Senden' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disabled bleibt echtes disabled', () => {
    render(<Button disabled>Weiter</Button>);
    expect(screen.getByRole('button', { name: 'Weiter' })).toHaveProperty('disabled', true);
  });
});
