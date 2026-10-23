/**
 * Minimaler, parametrisierender SQL-Baustein. Werte werden IMMER als Parameter ($1, $2 …) übergeben,
 * nie in den SQL-Text konkateniert (Guideline Kap. 07). Fragmente lassen sich verschachteln.
 */
export class Sql {
  constructor(
    readonly strings: readonly string[],
    readonly values: readonly unknown[],
  ) {}

  toQuery(): { text: string; values: unknown[] } {
    const values: unknown[] = [];
    const text = this.render(values);
    return { text, values };
  }

  private render(values: unknown[]): string {
    let text = this.strings[0] ?? '';
    this.values.forEach((value, i) => {
      if (value instanceof Sql) {
        text += value.render(values);
      } else if (value instanceof Raw) {
        text += value.text;
      } else {
        values.push(value);
        text += `$${values.length}`;
      }
      text += this.strings[i + 1] ?? '';
    });
    return text;
  }
}

class Raw {
  constructor(readonly text: string) {}
}

export function sql(strings: TemplateStringsArray, ...values: unknown[]): Sql {
  return new Sql(strings, values);
}

/** Nur für vertrauenswürdige, im Code festgelegte Bezeichner (z. B. Sortierausdrücke). */
export function raw(text: string): Raw {
  return new Raw(text);
}

export function join(fragments: Sql[], separator: string): Sql {
  if (fragments.length === 0) return sql``;
  const strings = [''];
  for (let i = 1; i < fragments.length; i++) strings.push(separator);
  strings.push('');
  return new Sql(strings, fragments);
}

export const empty = sql``;
