import { Polaroid } from '../ui/Polaroid';

export function Hero() {
  return (
    <section className="hero bg-section-paper" data-surface="paper">
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -54%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2.5rem',
        }}
      >
        <Polaroid
          src="https://placehold.co/800x1000/d4cfc0/3a3a3a?text=MvG"
          alt="Portrait of Meinhard von Gerkan"
          caption="Meinhard von Gerkan, circa 1970"
          width={800}
          height={1000}
          className="hero-polaroid"
          eager
        />
        <div className="text-center" style={{ marginTop: '1rem' }}>
          <h1
            className="font-serif text-ink"
            style={{
              fontSize: 'clamp(1.75rem, 3.4vw, 3rem)',
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: '-0.005em',
            }}
          >
            Make Something Lasting
          </h1>
          <p
            className="font-serif italic text-dust"
            style={{
              fontSize: 'clamp(1rem, 1.3vw, 1.375rem)',
              marginTop: '0.5rem',
            }}
          >
            Meinhard von Gerkan in his own words
          </p>
        </div>
      </div>
    </section>
  );
}
