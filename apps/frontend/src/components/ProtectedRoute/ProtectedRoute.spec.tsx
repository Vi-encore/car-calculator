import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { renderWithProviders } from "../../test/test-utils";
import { routes } from "../../constants/constantRoute";

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to the login page", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/calculator"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/calculator" element={<div>Protected Calculator Page</div>} />
          </Route>
          <Route path={routes.login} element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
      {
        preloadedState: {
          auth: { user: null, accessToken: null, isAuthenticated: false },
        },
      },
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Calculator Page")).not.toBeInTheDocument();
  });

  it("renders the protected component when user is authenticated", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/calculator"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/calculator" element={<div>Protected Calculator Page</div>} />
          </Route>
          <Route path={routes.login} element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
      {
        preloadedState: {
          auth: {
            user: { id: "1", email: "user@test.com" },
            accessToken: "valid-token",
            isAuthenticated: true,
          },
        },
      },
    );

    expect(screen.getByText("Protected Calculator Page")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
