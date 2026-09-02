import { describe, it, expect } from "vitest";
import authReducer, {
  setCredentials,
  logout,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAccessToken,
} from "./authSlice";
import type { User } from "@car-calculator/types";

describe("authSlice", () => {
  const initialState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
  };

  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
  };

  it("should return initial state when passed an empty action", () => {
    expect(authReducer(undefined, { type: "UNKNOWN_ACTION" })).toEqual(
      initialState,
    );
  });

  it("should handle setCredentials with both user and accessToken", () => {
    const nextState = authReducer(
      initialState,
      setCredentials({ user: mockUser, accessToken: "token-abc" }),
    );

    expect(nextState.user).toEqual(mockUser);
    expect(nextState.accessToken).toBe("token-abc");
    expect(nextState.isAuthenticated).toBe(true);
  });

  it("should handle setCredentials when updating only accessToken (refresh token scenario)", () => {
    const stateWithUser = {
      user: mockUser,
      accessToken: "old-token",
      isAuthenticated: true,
    };

    const nextState = authReducer(
      stateWithUser,
      setCredentials({ accessToken: "new-token" }),
    );

    expect(nextState.user).toEqual(mockUser); // User should remain unchanged
    expect(nextState.accessToken).toBe("new-token");
    expect(nextState.isAuthenticated).toBe(true);
  });

  it("should handle logout by resetting state to initial state", () => {
    const loggedInState = {
      user: mockUser,
      accessToken: "valid-token",
      isAuthenticated: true,
    };

    const nextState = authReducer(loggedInState, logout());

    expect(nextState).toEqual(initialState);
  });

  describe("selectors", () => {
    const sampleState = {
      auth: {
        user: mockUser,
        accessToken: "jwt-token-123",
        isAuthenticated: true,
      },
    };

    it("selectCurrentUser should return current user", () => {
      expect(selectCurrentUser(sampleState)).toEqual(mockUser);
    });

    it("selectIsAuthenticated should return authentication flag", () => {
      expect(selectIsAuthenticated(sampleState)).toBe(true);
    });

    it("selectAccessToken should return access token", () => {
      expect(selectAccessToken(sampleState)).toBe("jwt-token-123");
    });
  });
});
