# React Confetti Hook

A React hook for adding delightful confetti animations to your React applications. This hook provides an easy-to-use interface for triggering physics-based confetti effects with customizable properties.

## Features

- 🎉 Physics-based confetti animation with realistic motion
- 🎨 Randomized colors, shapes, and particle behavior
- 📱 Responsive scaling based on viewport size
- 🔄 Debounced firing to prevent performance issues
- 🧹 Automatic cleanup and resource management

## Installation

```bash
npm install @react-confetti-hook
```

## Usage

```tsx
import { useConfetti } from "@react-confetti-hook";

function CelebrationComponent() {
  const { fireConfetti, stopConfetti, isActive } = useConfetti();

  return (
    <button
      onClick={() => fireConfetti({
        bounceCount: 1,
        duration: 2000,
        particleCount: 300,
        size: 15,
        spread: 70,
        startVelocity: 50,
      });
      disabled={isActive}
    >
      Celebrate! 🎉
    </button>
  );
}
```

## API

### useConfetti Hook

The `useConfetti` hook returns an object with the following properties:

```typescript
{
  fireConfetti: (options?: ConfettiOptions) => void;
  stopConfetti: () => void;
  isActive: boolean;
}
```

### ConfettiOptions

The following options can be passed to `fireConfetti`:

```typescript
interface ConfettiOptions {
  bounceCount?: number; // Number of times particles bounce (default: 2)
  duration?: number; // Animation duration in ms (default: 2000)
  particleCount?: number; // Number of confetti particles (default: 150)
  randomizeStart?: boolean; // Randomize starting position (default: false)
  size?: number; // Particle size (default: 12)
  spread?: number; // Spread angle in degrees (default: 70)
  startVelocity?: number; // Initial velocity (default: 25)
  onStop?: () => void; // Callback when animation completes
}
```

## Features Details

- **Physics-Based Animation**: Includes gravity, wind effects, and realistic bouncing behavior
- **Responsive Scaling**: Automatically adjusts animation parameters based on viewport size
- **Performance Optimized**: Includes debouncing and cleanup mechanisms
- **Multiple Shapes**: Generates various particle shapes including circles, squares, and custom polygons
- **Auto Cleanup**: Automatically removes elements and stops animations when completed

## License

MIT
