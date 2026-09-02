import type { ReactElement } from "react";
import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/slices/authSlice";
import { apiSlice } from "../store/api/apiSlice";
import type { RootState } from "../store/store";

interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: Partial<RootState>;
}

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState = {}, ...renderOptions }: ExtendedRenderOptions = {},
) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    preloadedState: preloadedState as any,
    middleware: (getDefault) => getDefault().concat(apiSlice.middleware),
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }) };
}
