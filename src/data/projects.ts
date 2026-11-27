import { placeholder } from './placeholder';
import type { Localized } from './i18n';
import type { Source } from './chapters';

/**
 * Deep-dive entries ("Vertiefungen"). A chapter page links to one via
 * `projectId`. Phase 2 renders these as a second level that opens from
 * the reading path and returns to it.
 */
export type ProjectData = {
  id: string;
  name: Localized;
  city: Localized;
  /** Competition / design year. */
  competitionYear?: number;
  /** Completion or opening year. */
  completedYear?: number;
  summary: Localized;
  /** Images for the deep dive (placeholders until the gmp archive delivers). */
  images: { src: string; alt: Localized; caption?: Localized; credit?: string }[];
  /** Project page on gmp.de, the bridge to the practice. */
  gmpUrl?: string;
  sources: Source[];
};

export const projects: ProjectData[] = [
  {
    id: 'tegel',
    name: { de: 'Flughafen Berlin-Tegel', en: 'Berlin-Tegel Airport' },
    city: 'Berlin',
    competitionYear: 1965,
    completedYear: 1974,
    summary: {
      de: 'Der Wettbewerbsgewinn von 1965, mit dem gmp begann: ein sechseckiger Drive-in-Terminal mit kurzen Wegen vom Auto zum Flugsteig. Eröffnet 1974, Linienbetrieb bis November 2020.',
      en: 'The 1965 competition win that started gmp: a hexagonal drive-in terminal with short walks from car to gate. Opened in 1974, scheduled flights until November 2020.',
    },
    images: [
      {
        src: placeholder(1600, 1000, '2a2a2a', '444444', 'Tegel'),
        alt: { de: 'Terminal Tegel, Platzhalter', en: 'Tegel terminal, placeholder' },
      },
    ],
    gmpUrl: 'https://www.gmp.de/en/aktuelles/41/n-a/8878/txl',
    sources: [
      { work: 'gmp – History', url: 'https://www.gmp.de/en/office/32/profile/48/history' },
      { work: 'Wikipedia – Berlin Tegel Airport', url: 'https://en.wikipedia.org/wiki/Berlin-Tegel' },
    ],
  },
];

export function getProject(id: string): ProjectData | undefined {
  return projects.find((p) => p.id === id);
}
