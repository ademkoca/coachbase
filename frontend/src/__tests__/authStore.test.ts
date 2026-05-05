import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../store/authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: "loading",
      firebaseUser: null,
      trainer: null,
    });
  });

  it("starts in loading state", () => {
    expect(useAuthStore.getState().status).toBe("loading");
  });

  it("sets authenticated when user is provided", () => {
    useAuthStore.getState().setFirebaseUser({ uid: "abc" } as never);
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().firebaseUser?.uid).toBe("abc");
  });

  it("sets unauthenticated when null user is provided", () => {
    useAuthStore.getState().setFirebaseUser(null);
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("stores trainer data", () => {
    useAuthStore.getState().setTrainer({
      id: "x",
      email: "x@test.com",
      staleClientThresholdDays: 14,
      createdAt: new Date().toISOString(),
    });
    expect(useAuthStore.getState().trainer?.email).toBe("x@test.com");
  });
});
