/**
 * Critically-damped numerical spring. Stateful single-value interpolator.
 * Call step(dt) each frame; returns true while in motion, false when at rest.
 */
export class Spring {
  private value: number;
  private target: number;
  private velocity = 0;
  private tension: number;
  private friction: number;
  private readonly maxVelocity = 500;

  constructor(initial: number, tension = 170, friction = 26) {
    this.value = initial;
    this.target = initial;
    this.tension = tension;
    this.friction = friction;
  }

  get(): number {
    return this.value;
  }

  getTarget(): number {
    return this.target;
  }

  setTarget(t: number): void {
    this.target = t;
  }

  jumpTo(v: number): void {
    this.value = v;
    this.target = v;
    this.velocity = 0;
  }

  setPhysics(tension: number, friction: number): void {
    this.tension = tension;
    this.friction = friction;
  }

  isAtRest(): boolean {
    return (
      Math.abs(this.velocity) < 0.0005 &&
      Math.abs(this.value - this.target) < 0.0005
    );
  }

  /**
   * Advance the spring by dt seconds. Returns true if still in motion.
   */
  step(dt: number): boolean {
    if (this.isAtRest()) return false;

    const dx = this.value - this.target;
    const a = -this.tension * dx - this.friction * this.velocity;
    let v = this.velocity + a * dt;
    // velocity clamp to prevent runaway on huge target jumps (fast scrub)
    if (v > this.maxVelocity) v = this.maxVelocity;
    else if (v < -this.maxVelocity) v = -this.maxVelocity;
    this.velocity = v;
    this.value += this.velocity * dt;

    if (this.isAtRest()) {
      this.value = this.target;
      this.velocity = 0;
      return false;
    }
    return true;
  }

  /**
   * Progress in 0..1 of current position between start-of-motion and target.
   * Used by the zoom controller to detect "70% traveled" checkpoints.
   */
  progressFrom(start: number): number {
    const total = this.target - start;
    if (Math.abs(total) < 0.0001) return 1;
    const travelled = this.value - start;
    return Math.max(0, Math.min(1, travelled / total));
  }
}
