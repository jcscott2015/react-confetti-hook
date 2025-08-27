import {
  renderHook,
  act,
  beforeEach,
  describe,
  expect,
  it,
  waitFor,
} from "@/test-utils";
import { vi } from "vitest";
import { useConfetti } from "./useConfetti";
import { ConfettiOptions } from "../utils/confetti";

// Create spy functions that can be accessed from tests
const mockFire = vi.fn();
const mockStop = vi.fn();
let mockOnStopCallback: (() => void) | null = null;

vi.mock("./confetti", () => {
  // Mock ConfettiBurst class defined inside the factory
  class ConfettiBurstMock {
    fire = mockFire;
    stop = mockStop;
    constructor(public options: ConfettiOptions) {
      // Capture the onStop callback for testing
      mockOnStopCallback = options.onStop || null;
    }
  }

  return {
    ConfettiBurst: ConfettiBurstMock,
  };
});

describe("useConfetti", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnStopCallback = null;
    // Mock window dimensions for scaling
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
    });
  });

  it("should initialize with isActive false", () => {
    const { result } = renderHook(() => useConfetti());
    expect(result.current.isActive).toBe(false);
  });

  it("should fire confetti and set isActive true", async () => {
    const { result } = renderHook(() => useConfetti());
    act(() => {
      result.current.fireConfetti();
    });

    // Wait for debounce and state updates
    await waitFor(async () => {
      await new Promise((res) => setTimeout(res, 210));
      expect(result.current.isActive).toBe(true);
    });

    expect(mockFire).toHaveBeenCalled();
  });

  it("should stop confetti and set isActive false", async () => {
    const { result } = renderHook(() => useConfetti());
    act(() => {
      result.current.fireConfetti();
    });

    await waitFor(async () => {
      await new Promise((res) => setTimeout(res, 210));
      expect(result.current.isActive).toBe(true);
    });

    // Simulate onStop callback
    if (mockOnStopCallback) {
      act(() => {
        mockOnStopCallback!();
      });
    }

    await waitFor(() => {
      expect(result.current.isActive).toBe(false);
    });
  });

  it("should debounce rapid fireConfetti calls", async () => {
    const { result } = renderHook(() => useConfetti());
    act(() => {
      result.current.fireConfetti();
      result.current.fireConfetti();
    });

    await waitFor(async () => {
      await new Promise((res) => setTimeout(res, 210));
    });

    expect(mockFire).toHaveBeenCalledTimes(1);
  });

  it("should clean up and set isActive false after confetti onStop", async () => {
    const { result } = renderHook(() => useConfetti());
    act(() => {
      result.current.fireConfetti();
    });

    // Wait for confetti to be active
    await waitFor(async () => {
      await new Promise((res) => setTimeout(res, 210));
      expect(result.current.isActive).toBe(true);
    });

    // Simulate onStop callback
    if (mockOnStopCallback) {
      act(() => {
        mockOnStopCallback!();
      });
    }

    await waitFor(() => {
      expect(result.current.isActive).toBe(false);
    });
  });
});
