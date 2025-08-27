import { useCallback, useRef, useState } from "react";
import { ConfettiBurst, type ConfettiOptions } from "../utils/confetti";

interface UseConfettiReturn {
  fireConfetti: (options?: ConfettiOptions) => void;
  isActive: boolean;
  stopConfetti: () => void;
}

/**
 * Custom React hook to manage confetti bursts within a component.
 *
 * Provides methods to fire and stop confetti animations, and exposes the current active state.
 * Ensures only one confetti burst is active at a time, and automatically cleans up after the animation duration.
 *
 * @returns {UseConfettiReturn} An object containing:
 * - `fireConfetti(options?: ConfettiOptions): void` — Fires a confetti burst with optional configuration.
 * - `stopConfetti(): void` — Stops any active confetti burst and cleans up resources.
 * - `isActive: boolean` — Indicates whether a confetti burst is currently active.
 *
 * @example
 * const { fireConfetti, stopConfetti, isActive } = useConfetti();
 * fireConfetti({ particleCount: 100 });
 */
export const useConfetti = (): UseConfettiReturn => {
  const activeInstancesRef = useRef<ConfettiBurst | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Stop confetti instances
  const stopConfetti = useCallback(() => {
    if (!activeInstancesRef.current) return;
    activeInstancesRef.current.stop();
  }, []);

  const fireConfetti = useCallback((options?: ConfettiOptions) => {
    // Debounce rapid calls within 200ms
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      // Stop any existing confetti before starting a new one
      if (activeInstancesRef.current) {
        activeInstancesRef.current.stop();
        activeInstancesRef.current = null;
      }

      setIsActive(true);

      const { duration, particleCount, size, spread, startVelocity } =
        updateScalingFactors(options);
      const baseOptions = {
        ...options,
        duration,
        onStop: () => {
          activeInstancesRef.current = null;
          setIsActive(false);
        },
        particleCount,
        size,
        spread,
        startVelocity,
      };

      // Create new confetti instance
      activeInstancesRef.current = new ConfettiBurst(baseOptions);

      // Fire the confetti
      activeInstancesRef.current.fire();
    }, 200);
  }, []);

  return {
    fireConfetti,
    isActive,
    stopConfetti,
  };
};

/**
 * Calculates and returns scaling factors for confetti animation options based on the current window dimensions.
 *
 * The function normalizes the provided or default confetti options to a baseline window size (1200x800)
 * and scales the configuration values (duration, particle count, size, spread, start velocity) accordingly.
 * Each value is capped at a maximum to prevent excessive scaling.
 *
 * @param options - Optional configuration object for confetti animation.
 * @param options.duration - Duration of the confetti animation in milliseconds (default: 2000).
 * @param options.particleCount - Number of confetti particles (default: 150).
 * @param options.spread - Spread angle of the confetti in degrees (default: 70).
 * @param options.size - Size of each confetti particle (default: 15).
 * @param options.startVelocity - Initial velocity of the confetti particles (default: 25).
 * @returns An object containing the scaled confetti configuration values: duration, particleCount, size, spread, and startVelocity.
 */
const updateScalingFactors = (options?: ConfettiOptions) => {
  const {
    duration = 2000,
    particleCount = 150,
    spread = 70,
    size = 15,
    startVelocity = 25,
  } = options || {};

  const scalingFactors = {
    duration,
    particleCount,
    size,
    spread,
    startVelocity,
  };

  // Scale based on window dimensions
  const widthScale = window.innerWidth / 1200; // Normalize to 1200px baseline
  const heightScale = window.innerHeight / 800; // Normalize to 800px baseline
  const avgScale = (widthScale + heightScale) / 2;

  // Apply scaling to configuration values
  scalingFactors.size = Math.min(Math.round(size * avgScale), size);
  scalingFactors.particleCount = Math.min(
    Math.round(particleCount * avgScale),
    particleCount
  );
  scalingFactors.spread = Math.min(Math.round(spread * avgScale), spread);
  scalingFactors.startVelocity = Math.min(
    Math.round(startVelocity * avgScale),
    startVelocity
  );
  scalingFactors.duration = Math.min(Math.round(duration * avgScale), duration);

  return scalingFactors;
};
