import { placeholder } from './placeholder';
import { type Localized, resolveText } from './i18n';

export type ParagraphKind = 'text' | 'pullquote' | 'polaroid' | 'sticky-image';

/** Where a passage comes from. Every quote in MvG's voice needs one before launch. */
export type Source = {
  /** Book, speech, interview or archive item, e.g. "Architektur im Dialog". */
  work: string;
  year?: number;
  /** Page, minute or archive signature. */
  locator?: string;
  url?: string;
};

export type Provenance = {
  /**
   * verified   — checked against an original source (give `source`).
   * unverified — placeholder or taken from secondary sources; must not ship.
   * editorial  — written by the editors, not attributed to MvG.
   */
  status: 'verified' | 'unverified' | 'editorial';
  source?: Source;
  /** Fact-check remark shown in review mode (?review). */
  note?: string;
};

/**
 * Content types are generic over the text type `T`:
 * the source data below uses `Localized` (one string or {de, en}),
 * components receive the resolved `string` version for the active locale.
 */
type ParagraphOf<T> =
  | { kind: 'text'; content: T; provenance?: Provenance }
  | { kind: 'pullquote'; content: T; attribution?: T; provenance?: Provenance }
  | {
      kind: 'polaroid';
      src: string;
      alt: T;
      caption?: T;
      width: number;
      height: number;
      rotation?: number;
    }
  | {
      kind: 'sticky-image';
      src: string;
      alt: T;
      width: number;
      height: number;
      /** Background color of the full-bleed section. Defaults to 'ink'. */
      background?: 'ink' | 'dust';
      /** Large centered caption overlaid on the background. */
      caption?: T;
    };

type PageOf<T> = {
  id: string;
  title: T;
  /** Links this page to a deep-dive entry in projects.ts. */
  projectId?: string;
  paragraphs: ParagraphOf<T>[];
};

type ChapterOf<T> = {
  id: string;
  label: string; // year range — empty for non-chapter sections
  title: T;
  intro?: T; // blue italic headline
  /** The design principle this chapter is built around (Phase 2). */
  principle?: T;
  pages: PageOf<T>[];
};

export type Paragraph = ParagraphOf<string>;
export type PageData = PageOf<string>;
export type ChapterData = ChapterOf<string>;
type ChapterSource = ChapterOf<Localized>;

export const CHAPTER_BG: Record<string, 'paper' | 'ink' | 'dust'> = {
  intro: 'paper',
  'opening-quote': 'ink',
  'early-years': 'paper',
  'founding-gmp': 'ink',
  expansion: 'paper',
  legacy: 'ink',
  events: 'dust',
  credits: 'paper',
};

const chapterSource: ChapterSource[] = [
  // ---------- INTRODUCTION ----------
  {
    id: 'intro',
    label: '',
    title: 'Introduction',
    intro: 'Introduction by the Editors',
    pages: [
      {
        id: 'intro-main',
        title: 'Introduction',
        paragraphs: [
          {
            kind: 'text',
            provenance: { status: 'editorial' },
            content:
              'The best way to understand an architect is to walk through the rooms he built, and then to listen — carefully — to how he described the task of building them. For Meinhard von Gerkan, that task was never only about structure. It was about making something lasting: a gesture composed of concrete and light that would outlive the hands that placed it.',
          },
          {
            kind: 'text',
            provenance: { status: 'editorial' },
            content:
              'Across nearly sixty years of practice, von Gerkan and his partner Volkwin Marg shaped the postwar German imagination of what public space could be. Airports, railway stations, museums, concert halls, entire districts — all built around a small set of convictions so patient and unshowy that they could be easily mistaken for modesty.',
          },
          {
            kind: 'text',
            provenance: { status: 'editorial' },
            content:
              'What follows is a selection of his writings, speeches, and interviews, arranged chronologically. Much has been edited for brevity, but nothing for tone. These are his words as he offered them: rigorous, sometimes stern, quietly romantic about the craft he never stopped practicing.',
          },
        ],
      },
    ],
  },

  // ---------- OPENING QUOTE ----------
  {
    id: 'opening-quote',
    label: '',
    title: 'Opening Quote',
    pages: [
      {
        id: 'opening-quote-main',
        title: '',
        paragraphs: [
          {
            kind: 'pullquote',
            content:
              '"A building that lasts is one that was honest about what it was always going to become."',
            attribution: 'Meinhard von Gerkan, 1998',
          },
        ],
      },
    ],
  },

  // ---------- 1935–1965 ----------
  {
    id: 'early-years',
    label: '1935–1965',
    title: 'Early Years',
    intro: 'A childhood ended by history, a path discovered in its aftermath.',
    pages: [
      {
        id: 'riga',
        title: 'Riga',
        paragraphs: [
          {
            kind: 'text',
            provenance: { status: 'unverified', note: 'Faktenfehler: Der Vater war kein Arzt, sondern Soldat und fiel 1942 an der Ostfront (Wikipedia).' },
            content:
              'I was born on the third of January, 1935, in Riga. My family was Baltic German, which meant that we belonged, in some hazy inherited way, to a country that did not quite exist. My father was a doctor. My mother kept a small garden on the edge of the city where, in the summers before the war, we ate black bread with honey.',
          },
          {
            kind: 'polaroid',
            src: placeholder(800, 1000, 'f5f1e8', '1a1a1a', 'Riga 1938'),
            alt: 'Von Gerkan family home in Riga',
            caption: 'The house in Riga, photographed by his father, 1938.',
            width: 800,
            height: 1000,
            rotation: -1.5,
          },
          {
            kind: 'text',
            content:
              'I remember the light more than anything. The way it fell across the stone apartment buildings on Alberta Street — tall, confident, civic buildings, all art nouveau, all built in a burst of optimism about forty years before I was born. A child notices these things without understanding them. I understood them later.',
          },
        ],
      },
      {
        id: 'war-years',
        title: 'War Years',
        paragraphs: [
          {
            kind: 'text',
            provenance: { status: 'unverified', note: 'Faktenfehler: 1945 mit der Mutter nach Niedersachsen, Mutter starb kurz darauf; Pflegefamilien, ab 1949 bei einer Pastorenfamilie in Hamburg (Wikipedia).' },
            content:
              'In 1939, the Baltic Germans were resettled. What this meant, for a four-year-old, was an enormous train, a great deal of waiting, and a new apartment in a place called Poznań that my mother did not love. My father was conscripted. We moved twice more before I was ten, finally landing in Hamburg — or what remained of it.',
          },
          {
            kind: 'sticky-image',
            src: placeholder(800, 600, '2a2a2a', '444444'),
            alt: 'Hamburg after the war, 1946',
            width: 800,
            height: 600,
            background: 'ink',
            caption: 'Hamburg, 1946',
          },
          {
            kind: 'text',
            content:
              'When I first saw Hamburg, in the spring of 1946, it was a city that had been erased and was in the very earliest stages of rewriting itself. Architects of my generation are sometimes accused of a certain coldness, a refusal of ornament. I can only speak for myself. If I am cautious with ornament, it is because I grew up watching people rebuild their lives in streets where ornament had not saved anyone.',
          },
          {
            kind: 'pullquote',
            content:
              '"I grew up in streets where ornament had not saved anyone. I have been careful with it ever since."',
          },
        ],
      },
      {
        id: 'braunschweig-studies',
        title: 'Studies in Braunschweig',
        paragraphs: [
          {
            kind: 'text',
            provenance: { status: 'unverified', note: 'Prüfen: Vor Braunschweig studierte er Jura und Physik in Hamburg, ab 1956 Architektur an der TU Berlin, ab 1960 TU Braunschweig. Lehrer Kraemer nicht belegt.' },
            content:
              'I studied architecture at the Technische Universität Braunschweig. This was not a romantic decision. I had considered law, and briefly, out of curiosity, medicine — my father\'s profession. What turned me toward architecture was a professor named Friedrich Wilhelm Kraemer, whose office I wandered into by accident in my second year.',
          },
          {
            kind: 'text',
            provenance: { status: 'unverified', note: 'Prüfen: Rolle von F. W. Kraemer als Lehrer nicht belegt.' },
            content:
              'Kraemer told me that an architect\'s first task was to understand what a building was for. Not what it looked like, not what it was made of, not even who had commissioned it — but what it was meant to do in the life of the person walking through it. This sounds obvious. It is not obvious. Most buildings are designed for the photograph, not for the Tuesday afternoon.',
          },
          {
            kind: 'polaroid',
            src: placeholder(800, 1000, 'f5f1e8', '1a1a1a', 'Braunschweig 1962'),
            alt: 'Von Gerkan at TU Braunschweig',
            caption: 'At the Technische Universität Braunschweig, 1962.',
            width: 800,
            height: 1000,
            rotation: 2,
          },
          {
            kind: 'text',
            content:
              'I graduated in 1964. I met Volkwin Marg in the same building, in roughly the same circumstances, a few years earlier. Within a year of my graduation we had won a competition neither of us had expected to enter, for an airport in a city that neither of us had lived in.',
          },
        ],
      },
    ],
  },

  // ---------- 1965–1985 ----------
  {
    id: 'founding-gmp',
    label: '1965–1985',
    title: 'Founding gmp',
    intro: 'Two young architects, one airport, and the quiet beginning of a practice.',
    pages: [
      {
        id: 'partnership',
        title: 'The Partnership',
        paragraphs: [
          {
            kind: 'text',
            provenance: { status: 'unverified', note: 'Prüfen: Der Tegel-Wettbewerb wurde laut gmp gemeinsam mit Klaus Nickels gewonnen. Name des dritten Mitglieds klären.' },
            content:
              'Volkwin and I founded gmp in 1965. The full name was Gerkan, Marg and Partners, which made us sound much older and much larger than we were. At the beginning there were three of us — Volkwin, me, and Klaus Nickels — working from a rented room in Hamburg with one drafting table and one telephone.',
          },
          {
            kind: 'text',
            content:
              'The arrangement between Volkwin and me was that we would make all major decisions together and dispute none of them in public. We have held to this for the entire history of the practice. On the few occasions when we have disagreed seriously — and there have been several — the disagreement stayed in the room until it was resolved.',
          },
          {
            kind: 'pullquote',
            content:
              '"A partnership is a building of its own kind. It has load-bearing walls you do not see."',
          },
        ],
      },
      {
        id: 'tegel-airport',
        title: 'Berlin-Tegel Airport',
        projectId: 'tegel',
        paragraphs: [
          {
            kind: 'text',
            content:
              'In 1965 the authorities of West Berlin announced a competition for a new airport at Tegel, in the northern part of the city. We were young and very underqualified. We entered anyway, along with, as it turned out, more than seventy other firms.',
          },
          {
            kind: 'sticky-image',
            src: placeholder(800, 600, '555555', '666666'),
            alt: 'Berlin-Tegel Airport, 1974',
            width: 800,
            height: 600,
            background: 'ink',
            caption: 'Berlin-Tegel, 1974',
          },
          {
            kind: 'text',
            content:
              'Our proposal was a hexagon. A drive-up terminal in which you could step from your taxi to your gate in under thirty meters — no corridors, no escalators, no marching through halls. We had been struck, by that point, by a particular quality of airports we disliked: they asked too much of the traveler\'s patience. The hexagon was our answer to that impatience.',
          },
          {
            kind: 'polaroid',
            src: placeholder(800, 1000, 'f5f1e8', '1a1a1a', 'Tegel Model 1965'),
            alt: 'Tegel hexagon model',
            caption: 'The competition model, 1965. The gates radiated from the traveler, not the other way around.',
            width: 800,
            height: 1000,
            rotation: -2.5,
          },
          {
            kind: 'text',
            provenance: { status: 'unverified', note: 'Faktenfehler: Terminal eröffnet 1974 (Wikipedia: 1. Nov. 1974), letzter Linienflug 8. Nov. 2020.' },
            content:
              'We won. We were still in our twenties. The building opened to the public in 1975 — ten years of construction — and served Berlin until 2020. I visited it on its last day of operation. It had worn well.',
          },
        ],
      },
      {
        id: 'first-decade',
        title: 'The First Decade',
        paragraphs: [
          {
            kind: 'text',
            content:
              'The decade after Tegel was, for the practice, a kind of patient apprenticeship. Museums, small concert halls, two university buildings, a handful of residential commissions we should not have accepted. I learned, among other things, that a firm\'s character is set in its first five years and is almost impossible to change afterward.',
          },
          {
            kind: 'text',
            content:
              'We made a rule early on: we would not design any building we would not want to visit on a Sunday. This was Volkwin\'s phrase, not mine, and I disliked it at first because it sounded sentimental. I came to understand it. A building that repels you on a Sunday is a building that was designed for reasons other than the people who use it.',
          },
        ],
      },
    ],
  },

  // ---------- 1985–2000 ----------
  {
    id: 'expansion',
    label: '1985–2000',
    title: 'International Expansion',
    intro: 'The fall of the wall, and the sudden presence of work in places we had never seen.',
    pages: [
      {
        id: 'europe',
        title: 'Europe',
        paragraphs: [
          {
            kind: 'text',
            content:
              'The late 1980s were busy. Rostock, Hanover, Stuttgart — competitions we won and competitions we did not. We were learning how to work on several continents at once, which is a discipline more administrative than architectural. I spent a great deal of time on trains.',
          },
          {
            kind: 'polaroid',
            src: placeholder(800, 1000, 'f5f1e8', '1a1a1a', 'Stuttgart 1991'),
            alt: 'Stuttgart Trade Fair construction',
            caption: 'Stuttgart Trade Fair under construction, 1991.',
            width: 800,
            height: 1000,
            rotation: 1,
          },
          {
            kind: 'text',
            content:
              'When the wall came down in 1989, everything changed — for the country and for our practice. Work in the east arrived very quickly, in quantities we had not anticipated, and we were forced to decide, within about six months, whether we were going to be a small firm that made careful buildings or a large firm that made a great many buildings. We chose neither option, really. We tried to be both.',
          },
        ],
      },
      {
        id: 'leipzig',
        title: 'Leipzig',
        paragraphs: [
          {
            kind: 'text',
            content:
              'Leipzig was the first major project in the former east. The new Trade Fair grounds, completed in 1996 — a glass hall nearly two hundred meters long, with a roof that we had fought about internally for almost a year before the design settled. I still consider that roof our most underrated piece of engineering.',
          },
          {
            kind: 'sticky-image',
            src: placeholder(800, 600, '2a2a2a', '444444'),
            alt: 'Leipzig Trade Fair glass hall',
            width: 800,
            height: 600,
            background: 'ink',
            caption: 'Leipziger Messe, 1996',
          },
          {
            kind: 'pullquote',
            content:
              '"A roof is a promise. You are telling the person who walks in that nothing above them will fall."',
          },
        ],
      },
      {
        id: 'stuttgart',
        title: 'Stuttgart',
        paragraphs: [
          {
            kind: 'text',
            content:
              'Stuttgart was an argument that lasted fifteen years. The trade fair, the rail station, the broader question of what the city wanted to be. I learned to accept that an architect is sometimes also a participant in a public conversation he did not ask to join. It is not the part of the work I enjoy. It is the part of the work the work requires.',
          },
        ],
      },
    ],
  },

  // ---------- 2000–2022 ----------
  {
    id: 'legacy',
    label: '2000–2022',
    title: 'Legacy',
    intro: 'A late career across continents, and a practice handed forward.',
    pages: [
      {
        id: 'china-arrival',
        title: 'Arriving in China',
        paragraphs: [
          {
            kind: 'text',
            provenance: { status: 'unverified', note: 'Prüfen: 1998 gewann gmp den Wettbewerb für die Deutsche Schule Peking. Gründungsjahr des Pekinger Büros nicht belegt.' },
            content:
              'Our first project in China was in 1998. By 2002 we had opened an office in Beijing. I had not expected this chapter. I had assumed that I would spend the last part of my life refining a few European commissions and quietly stepping back. China made that impossible. The scale of the work was unlike anything I had seen.',
          },
          {
            kind: 'polaroid',
            src: placeholder(800, 1000, 'f5f1e8', '1a1a1a', 'Beijing 2003'),
            alt: 'At the Beijing office, 2003',
            caption: 'At the new Beijing office, 2003.',
            width: 800,
            height: 1000,
            rotation: -1,
          },
        ],
      },
      {
        id: 'lingang-nanning',
        title: 'Lingang and Nanning',
        paragraphs: [
          {
            kind: 'text',
            content:
              'Lingang was a new city — literally, a city, planned from scratch for a coastal district south of Shanghai. We laid out the center around a circular lake, which in the summers was shallow enough that children waded across it. Nanning followed, and then a dozen others. I stopped keeping a map of where the practice was working. Volkwin kept one. I envied him his capacity for geography.',
          },
          {
            kind: 'sticky-image',
            src: placeholder(800, 600, '2a2a2a', '444444'),
            alt: 'Lingang master plan',
            width: 800,
            height: 600,
            background: 'ink',
            caption: 'Lingang New City',
          },
        ],
      },
      {
        id: 'tianjin',
        title: 'Tianjin Grand Theatre',
        paragraphs: [
          {
            kind: 'text',
            content:
              'The Tianjin Grand Theatre opened in 2012. A concert hall and an opera house sharing one roof — a great flat disc hovering above a public plaza. It is the only building I ever designed that I approached, on the day of the opening, with something like reverence. I think I understood, standing underneath that disc, that I had spent my career trying to make rooms where people would be quieter than they expected to be.',
          },
          {
            kind: 'pullquote',
            content:
              '"I have spent my career trying to make rooms where people are quieter than they expected to be."',
          },
        ],
      },
      {
        id: 'academy',
        title: 'The Academy',
        paragraphs: [
          {
            kind: 'text',
            content:
              'In 2007 we founded the Academy for Architectural Culture in Hamburg — gmp\'s attempt to give something back to the education we had received. Students came for a semester and worked on real problems with real constraints. I taught when I could. I was a clumsy teacher at first, then a somewhat less clumsy one.',
          },
          {
            kind: 'text',
            provenance: { status: 'unverified', note: 'Prüfen: Rückzug 2018 nicht belegt. Gestorben 30.11.2022 in Hamburg ist belegt.' },
            content:
              'I retired from full-time practice in 2018. I continued to visit the studio, and to comment on projects I could not help commenting on. I died on the 30th of November, 2022. I leave behind a practice I love, a body of buildings I could not have imagined at the beginning, and the firm conviction — unchanged since the morning I walked into Kraemer\'s office — that the work of architecture is, at its heart, an act of patience.',
          },
        ],
      },
    ],
  },

  // ---------- EVENTS ----------
  {
    id: 'events',
    label: '',
    title: 'Events',
    intro: 'A chronology.',
    pages: [
      {
        id: 'events-main',
        title: 'Chronology',
        paragraphs: [
          {
            kind: 'text',
            provenance: { status: 'editorial' },
            content:
              '1935 — Born in Riga, Latvia, to a Baltic German family. 1939 — Resettlement of Baltic Germans; the family moves west. 1945 — Flees with his mother to Lower Saxony; his mother dies shortly after. 1949 — Taken in by a pastor\'s family in Hamburg. 1956 — Begins architecture studies at the TU Berlin, where he meets Volkwin Marg. 1964 — Graduates from the Technische Universität Braunschweig. 1965 — Founds gmp Architekten with Volkwin Marg; wins the Berlin-Tegel Airport competition. 1974 — Berlin-Tegel Airport opens. 1989 — Expansion of the practice after German reunification. 1996 — Leipzig Trade Fair completed. 1998 — gmp wins the competition for the German School in Beijing. 2002 — Work begins on the master plan for Lingang New City near Shanghai. 2006 — Berlin Hauptbahnhof opens. 2007 — Founding of the Academy for Architectural Culture in Hamburg. 2012 — Tianjin Grand Theatre opens. 2020 — Berlin-Tegel Airport closes after forty-five years of service. 2022 — Dies on 30 November in Hamburg, at the age of 87.',
          },
        ],
      },
    ],
  },

  // ---------- CREDITS ----------
  {
    id: 'credits',
    label: '',
    title: 'Credits',
    pages: [
      {
        id: 'credits-main',
        title: 'Credits',
        paragraphs: [
          {
            kind: 'text',
            provenance: { status: 'editorial' },
            content:
              'This digital edition was assembled from public writings, recorded interviews, and excerpts of speeches delivered between 1964 and 2018. The editorial voice has been kept light; where brackets appear, they mark minor clarifications added for reading flow. Photographs are placeholder compositions pending permissions from the gmp archive in Hamburg. Design and engineering by the editors. With thanks to the staff of the Academy for Architectural Culture, and to Volkwin Marg.',
          },
          {
            kind: 'text',
            provenance: { status: 'editorial' },
            content:
              'Typeset in EB Garamond and Inter. The timeline to your right is an instrument of navigation — drag it, click a year, or step back from the page entirely. The book will wait for you.',
          },
        ],
      },
    ],
  },
];

function resolveParagraph(p: ParagraphOf<Localized>): Paragraph {
  switch (p.kind) {
    case 'text':
      return { ...p, content: resolveText(p.content) };
    case 'pullquote':
      return {
        ...p,
        content: resolveText(p.content),
        attribution: p.attribution === undefined ? undefined : resolveText(p.attribution),
      };
    case 'polaroid':
    case 'sticky-image':
      return {
        ...p,
        alt: resolveText(p.alt),
        caption: p.caption === undefined ? undefined : resolveText(p.caption),
      };
  }
}

/** Chapters resolved to the active locale. */
export const chapters: ChapterData[] = chapterSource.map((c) => ({
  ...c,
  title: resolveText(c.title),
  intro: c.intro === undefined ? undefined : resolveText(c.intro),
  principle: c.principle === undefined ? undefined : resolveText(c.principle),
  pages: c.pages.map((pg) => ({
    ...pg,
    title: resolveText(pg.title),
    paragraphs: pg.paragraphs.map(resolveParagraph),
  })),
}));
