import type { User } from "@car-calculator/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface IAuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: IAuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user?: User; accessToken?: string }>,
    ) => {
      const { user, accessToken } = action.payload;
      if (user !== undefined) {
        state.user = user;
      }
      if (accessToken !== undefined) {
        state.accessToken = accessToken;
      }
      state.isAuthenticated = true;
    },
    logout: () => initialState,
  },
});

export const { setCredentials, logout } = AuthSlice.actions;

export default AuthSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: IAuthState }) =>
  state.auth.user;
export const selectIsAuthenticated = (state: { auth: IAuthState }) =>
  state.auth.isAuthenticated;
export const selectAccessToken = (state: { auth: IAuthState }) =>
  state.auth.accessToken;
