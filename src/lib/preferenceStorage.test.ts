/**
 * F1.12 / F1.14: Assessment and preference storage testing
 * Validates that responses are saved correctly and data handling is secure.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveOnboardingToLocalStorage,
  getOnboardingFromLocalStorage,
  clearOnboardingFromLocalStorage,
  type OnboardingData,
} from "./preferenceStorage";

describe("F1.12 / F1.14 Preference Storage", () => {
  beforeEach(() => {
    clearOnboardingFromLocalStorage();
    vi.spyOn(Storage.prototype, "getItem");
    vi.spyOn(Storage.prototype, "setItem");
  });

  it("saves and retrieves onboarding data correctly", () => {
    const data: OnboardingData = {
      anxietyLevel: 2,
      goals: ["confidence", "friends"],
      comfortPreferences: ["slow", "anonymous"],
    };
    saveOnboardingToLocalStorage(data);
    const retrieved = getOnboardingFromLocalStorage();
    expect(retrieved).toEqual(data);
  });

  it("saves social comfort context when provided", () => {
    const data: OnboardingData = {
      anxietyLevel: 1,
      socialComfortContext: ["meeting-new", "small-talk"],
      goals: [],
      comfortPreferences: [],
    };
    saveOnboardingToLocalStorage(data);
    const retrieved = getOnboardingFromLocalStorage();
    expect(retrieved?.socialComfortContext).toEqual(["meeting-new", "small-talk"]);
  });

  it("returns null when no data stored", () => {
    expect(getOnboardingFromLocalStorage()).toBeNull();
  });

  it("returns null when data is invalid", () => {
    localStorage.setItem("safespace_onboarding_pending", "invalid json");
    expect(getOnboardingFromLocalStorage()).toBeNull();
  });

  it("returns null when anxietyLevel is missing", () => {
    localStorage.setItem(
      "safespace_onboarding_pending",
      JSON.stringify({ goals: [], comfortPreferences: [] })
    );
    expect(getOnboardingFromLocalStorage()).toBeNull();
  });

  it("clears data after clearOnboardingFromLocalStorage", () => {
    saveOnboardingToLocalStorage({
      anxietyLevel: 1,
      goals: [],
      comfortPreferences: [],
    });
    clearOnboardingFromLocalStorage();
    expect(getOnboardingFromLocalStorage()).toBeNull();
  });
});
