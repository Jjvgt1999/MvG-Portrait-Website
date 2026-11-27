# Make Something Lasting — Meinhard von Gerkan

Digitales Portrait von Meinhard von Gerkan und gmp. React 18, Vite, Tailwind, eigene Scroll- und Timeline-Engine.

## Entwickeln

```bash
npm ci
npm run dev      # lokaler Server
npm run build    # Produktions-Build nach dist/
```

## Inhalte

- `src/data/chapters.ts`: Kapitel, Seiten und Absätze. Texte sind `Localized` (ein String = Englisch, oder `{ de, en }`).
- `src/data/projects.ts`: Vertiefungen pro Projekt (z. B. Tegel), mit Link zu gmp.de und Quellen.
- `src/data/i18n.ts`: Sprache über `?lang=de` oder `?lang=en`.

Jeder Text in MvGs Stimme braucht eine `provenance` mit Status `verified` und Quelle, bevor die Seite online geht.
Mit `?review` in der URL werden alle unbelegten Passagen markiert. Siehe `docs/FAKTENCHECK.md`.
