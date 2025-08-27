import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useConfetti } from "../index";
import { ConfettiOptions } from "../utils/confetti";

// Create spy functions that can be accessed from tests
const mockFire = vi.fn();
const mockStop = vi.fn();
let mockOnStopCallback: (() => void) | null = null;

vi.mock("../utils/confetti", () => ({
  ConfettiBurst: class {
    fire = mockFire;
    stop = mockStop;
    constructor(public options: ConfettiOptions) {
      mockOnStopCallback = options.onStop || null;
    }
  },
}));

describe("useConfetti", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockOnStopCallback = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with isActive false", () => {
    const { result } = renderHook(() => useConfetti());
    expect(result.current.isActive).toBe(false);
  });

  it("should fire confetti and set isActive true", () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.fireConfetti();
      vi.advanceTimersByTime(210);
    });

    expect(result.current.isActive).toBe(true);
    expect(mockFire).toHaveBeenCalled();
  });

  it("should debounce rapid fireConfetti calls", () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.fireConfetti();
      result.current.fireConfetti();
      vi.advanceTimersByTime(210);
    });

    expect(mockFire).toHaveBeenCalledTimes(1);
  });

  it("should clean up and set isActive false after confetti onStop", () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.fireConfetti();
      vi.advanceTimersByTime(210);
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      if (mockOnStopCallback) {
        mockOnStopCallback();
      }
    });

    expect(result.current.isActive).toBe(false);
  });
});
