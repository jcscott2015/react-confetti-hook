export interface ConfettiOptions {
  bounceCount?: number;
  duration?: number;
  particleCount?: number;
  randomizeStart?: boolean;
  size?: number;
  spread?: number;
  startVelocity?: number;
  onStop?: () => void;
}

type ConfettiConfig = Required<ConfettiOptions>;

/**
 * ConfettiBurst class for creating upward-shooting confetti effects that drift down
 */
export class ConfettiBurst {
  private readonly animationIds: Map<HTMLDivElement, number> = new Map();
  private cleanupTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly config: ConfettiConfig;
  private container: HTMLDivElement | null = null;
  private readonly particles: HTMLDivElement[] = [];

  constructor(options?: ConfettiOptions) {
    this.config = {
      bounceCount: 2,
      duration: 2000,
      onStop: () => {},
      particleCount: 150,
      randomizeStart: false,
      size: 12,
      spread: 70,
      startVelocity: 25,
      ...options,
    };
  }

  /**
   * Creates and starts the confetti burst effect
   */
  public fire(): void {
    this.createContainer();
    this.createParticles();
    this.scheduleCleanup();
  }

  /**
   * Manually stop and clean up the confetti effect
   */
  public stop(): void {
    this.cleanup();
  }

  /**
   * Calculates and applies fade out effect to a particle based on animation progress.
   * Fades out particles in the last 30% of their duration.
   *
   * @param particle - The HTMLDivElement to apply fade effect to
   * @param timeLeft - Remaining time in milliseconds
   * @param duration - Total animation duration in milliseconds
   * @returns The current opacity value
   */
  private applyFadeOut(particle: HTMLDivElement, timeLeft: number, duration: number): number {
    const progress = 1 - timeLeft / duration;

    if (progress > 0.7) {
      const opacity = 1 - (progress - 0.7) / 0.3; // Fade over last 30%
      particle.style.opacity = `${opacity}`;
      return opacity;
    }

    return 1; // Full opacity
  }

  /**
   * Handles collision with the top viewport boundary
   * @param y - Current Y position
   * @param vy - Current vertical velocity
   * @param bounces - Current bounce count
   * @param bounceCount - Maximum bounces allowed
   * @param bounceDamping - Velocity reduction factor
   * @returns Updated physics state
   */
  private handleTopBounce(
    y: number,
    vy: number,
    bounces: number,
    bounceCount: number,
    bounceDamping: number
  ): { y: number; vy: number; bounces: number; isSettling: boolean } {
    if (y <= 0 && vy < 0) {
      const newBounces = bounces + 1;
      const newVy = -vy * bounceDamping;
      const isSettling = newBounces >= bounceCount;

      return {
        y: 0,
        vy: isSettling ? Math.abs(newVy * 0.5) : newVy, // Gentle fall after bounces
        bounces: newBounces,
        isSettling,
      };
    }

    return { y, vy, bounces, isSettling: bounces >= bounceCount };
  }

  /**
   * Handles collision with the bottom viewport boundary
   * @param y - Current Y position
   * @param vy - Current vertical velocity
   * @param bounces - Current bounce count
   * @param bounceCount - Maximum bounces allowed
   * @param bounceDamping - Velocity reduction factor
   * @param isSettling - Whether particle is in settling phase
   * @returns Updated physics state
   */
  private handleBottomBounce(
    y: number,
    vy: number,
    bounces: number,
    bounceCount: number,
    bounceDamping: number,
    isSettling: boolean
  ): { y: number; vy: number; bounces: number; isSettling: boolean } {
    const viewportBottom = window.innerHeight - 20;

    if (y >= viewportBottom && vy > 0 && !isSettling) {
      const newBounces = bounces + 1;
      const newVy = -vy * bounceDamping;
      const newIsSettling = newBounces >= bounceCount;

      return {
        y: viewportBottom,
        vy: newVy,
        bounces: newBounces,
        isSettling: newIsSettling,
      };
    }

    return { y, vy, bounces, isSettling };
  }

  /**
   * Handles collision with side viewport boundaries
   * @param x - Current X position
   * @param vx - Current horizontal velocity
   * @returns Updated horizontal physics state
   */
  private handleSideBounce(x: number, vx: number): { x: number; vx: number } {
    const viewportLeft = 0;
    const viewportRight = window.innerWidth;

    if (x <= viewportLeft && vx < 0) {
      return { x: viewportLeft, vx: -vx * 0.8 };
    } else if (x >= viewportRight && vx > 0) {
      return { x: viewportRight, vx: -vx * 0.8 };
    }

    return { x, vx };
  }

  /**
   * Creates and appends a fixed-position container div to the document body.
   * The container covers the entire viewport, is non-interactive, and is intended
   * to hold confetti elements. It is styled to be on top of other content using a high z-index.
   */
  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 9999;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Creates and initializes confetti particles within the container element.
   *
   * - Determines the starting position for each particle, either at the center of the viewport or randomized if configured.
   * - Calculates the spread and angle for each particle to achieve a scattered effect.
   * - Appends each particle to the container and triggers its animation.
   */
  private createParticles(): void {
    if (!this.container) return;

    const { particleCount, randomizeStart, spread } = this.config;

    // Generate random or centered X position
    const centerX = randomizeStart
      ? Math.random() * window.innerWidth // Random X across full width
      : window.innerWidth / 2;
    const startY = window.innerHeight + spread; // Start below the viewport

    // Create particles in batch
    const fragment = document.createDocumentFragment();

    for (let i = 1; i < particleCount; i++) {
      const particle = this.createParticle();

      // Starting position (bottom center with scaled spread)
      const angle = (Math.random() - 0.5) * spread;
      const spreadOffset = (Math.random() - 0.5) * (window.innerWidth * 0.3); // 30% of screen width spread
      const startX = centerX + spreadOffset;

      // Position particle at bottom
      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;

      fragment.appendChild(particle);
      this.particles.push(particle);
      this.animateParticle(particle, startX, startY, angle);
    }
    // Single DOM operation instead of multiple appendChild calls
    this.container.appendChild(fragment);
  }

  /**
   * Creates a single confetti particle as an HTMLDivElement with randomized size, aspect ratio,
   * color, and shape. The particle is styled with absolute positioning and its transform origin
   * is set to the center.
   *
   * @returns {HTMLDivElement} The styled confetti particle element.
   */
  private createParticle(): HTMLDivElement {
    const { size } = this.config;
    const particle = document.createElement('div');
    const width = (Math.random() - 0.25) * size * 2;
    const height = (Math.random() - 0.25) * size * 2;

    // Use cssText for better performance
    particle.style.cssText = `
      position: absolute;
      width: ${width}px;
      height: ${height}px;
      background-color: ${this.getRandomColor()};
      border-radius: ${this.getRandomShape()};
      transform-origin: center center;
    `;

    return particle;
  }

  /**
   * Animates a single confetti particle using physics-based motion and visual effects.
   *
   * The particle is moved according to initial velocity, angle, gravity, wind, and rotation.
   * The animation fades out the particle near the end of its duration.
   *
   * @param particle - The HTMLDivElement representing the confetti particle to animate.
   * @param startX - The initial X position of the particle.
   * @param startY - The initial Y position of the particle.
   * @param angle - The launch angle (in degrees) for the particle's initial trajectory.
   */
  private animateParticle(particle: HTMLDivElement, startX: number, startY: number, angle: number): void {
    const { duration, startVelocity, bounceCount } = this.config;

    // Physics parameters
    const velocity = startVelocity * (0.8 + Math.random() * 0.4);
    const angleRad = (angle * Math.PI) / 180;
    const horizontalVelocity = Math.sin(angleRad) * velocity * 0.5;
    const initialVerticalVelocity = -Math.abs(velocity); // Always shoot upward
    const rotationSpeed = (Math.random() - 0.5) * velocity;
    const wind = (Math.random() - 0.5) * 0.1;
    const gravity = 0.8;
    const bounceDamping = 0.7; // Velocity reduction on bounce

    // Animation variables
    let rotation = 0;
    let x = startX;
    let y = startY;
    let vy = initialVerticalVelocity;
    let vx = horizontalVelocity;
    let bounces = 0;
    let isSettling = false;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const update = (): void => {
      const now = Date.now();
      const timeLeft = endTime - now;

      if (timeLeft <= 0) {
        this.animationIds.delete(particle);
        return;
      }

      // Apply physics
      if (!isSettling) {
        vy += gravity; // Gravity pulls downward
        vx += wind * 0.05; // Subtle wind effect
      } else {
        // Settling physics - slower fall
        vy += gravity * 0.3;
        vx *= 0.98; // Air resistance
      }

      x += vx;
      y += vy;
      rotation += rotationSpeed;

      // Start handle collisions
      const topBounceResult = this.handleTopBounce(y, vy, bounces, bounceCount, bounceDamping);
      y = topBounceResult.y;
      vy = topBounceResult.vy;
      bounces = topBounceResult.bounces;
      isSettling = topBounceResult.isSettling;

      const bottomBounceResult = this.handleBottomBounce(y, vy, bounces, bounceCount, bounceDamping, isSettling);
      y = bottomBounceResult.y;
      vy = bottomBounceResult.vy;
      bounces = bottomBounceResult.bounces;
      isSettling = bottomBounceResult.isSettling;

      const sideBounceResult = this.handleSideBounce(x, vx);
      x = sideBounceResult.x;
      vx = sideBounceResult.vx;
      // End handle collisions

      // Apply transformations
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.transform = `rotate(${rotation}deg)`;

      // Fade out in the last 30% of duration
      this.applyFadeOut(particle, timeLeft, duration);

      const frameId = requestAnimationFrame(update);
      this.animationIds.set(particle, frameId);
    };

    const frameId = requestAnimationFrame(update);
    this.animationIds.set(particle, frameId);
  }

  /**
   * Schedules the cleanup process to run after a specified duration.
   *
   * Uses `setTimeout` to invoke the `cleanup` method once the time defined in `this.config.duration` has elapsed.
   */
  private scheduleCleanup(): void {
    // Clear any existing timeout first
    if (this.cleanupTimeoutId !== null) {
      clearTimeout(this.cleanupTimeoutId);
      this.cleanupTimeoutId = null;
    }

    this.cleanupTimeoutId = setTimeout(() => {
      this.cleanup();
    }, this.config.duration);
  }

  /**
   * Cleans up the confetti animation by removing the container element from the DOM,
   * clearing all particles, and cancelling any ongoing animation frames.
   *
   * This method should be called when the confetti effect is no longer needed to
   * free up resources and prevent memory leaks.
   */
  private cleanup(): void {
    // Clear the cleanup timeout if it exists
    if (this.cleanupTimeoutId !== null) {
      clearTimeout(this.cleanupTimeoutId);
      this.cleanupTimeoutId = null;
    }

    if (this.container && document.body.contains(this.container)) {
      document.body.removeChild(this.container);
    }
    this.container = null;
    this.particles.length = 0; // More efficient than reassigning

    // Cancel all animation frames
    this.animationIds.forEach((id) => cancelAnimationFrame(id));
    this.animationIds.clear();

    // Call the onStop callback if provided
    if (this.config.onStop) {
      this.config.onStop();
    }
  }

  /**
   * Generates a random HSLA color string.
   *
   * The hue is randomly selected between 0 and 360 degrees.
   * Saturation is set to 100%, and lightness to 50%.
   * The alpha (opacity) value is randomly chosen between 0.7 and 1.0.
   *
   * @returns {string} A random HSLA color string.
   */
  private getRandomColor(): string {
    return `hsla(${Math.random() * 360}, 100%, 50%, ${0.7 + Math.random() * 0.3})`;
  }

  /**
   * Returns a random CSS border-radius string representing a confetti shape.
   *
   * The shapes include squares, circles, half-circles, blobs, pills, squiggles, and other
   * irregular or soft rectangles, suitable for generating visually diverse confetti pieces.
   *
   * @returns {string} A randomly selected border-radius value for a confetti shape.
   */
  private getRandomShape(): string {
    const shapes = [
      '0%', // square
      '50%', // circle
      '50% 50% 0% 0%', // Half-circle up
      '0% 0% 50% 50%', // Half-circle down
      '30% 70% 70% 30% / 30% 30% 70% 70%', // blob
      '20% 80% 60% 40% / 50% 60% 40% 50%', // irregular blob
      '40% 60% 60% 40% / 40% 60% 60% 40%', // soft rectangle
      '60% 40% 40% 60% / 60% 40% 40% 60%', // soft rectangle flipped
      '70% 30% 30% 70% / 70% 70% 30% 30%', // diagonal blob
      '50% 20% 50% 20% / 20% 50% 20% 50%', // pill
      '80% 20% 80% 20% / 20% 80% 20% 80%', // squiggle
      '25% 75% 75% 25% / 75% 25% 25% 75%', // asymmetric blob
    ];
    return shapes[Math.floor(Math.random() * shapes.length)];
  }
}

// Convenience function for backward compatibility
export function createConfettiBurst(options?: ConfettiOptions): void {
  const confetti = new ConfettiBurst(options);
  confetti.fire();
}
