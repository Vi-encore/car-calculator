import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { renderWithProviders } from "../../test/test-utils";
import { routes } from "../../constants/constantRoute";

describe("PublicOnlyRoute", () => {
  it("renders the guest component when user is not authenticated", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<div>Guest Login Page</div>} />
          </Route>
          <Route path={routes.calculator} element={<div>Calculator Page</div>} />
        </Routes>
      </MemoryRouter>,
      {
        preloadedState: {
          auth: { user: null, accessToken: null, isAuthenticated: false },
        },
      },
    );

    expect(screen.getByText("Guest Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Calculator Page")).not.toBeInTheDocument();
  });

  it("redirects authenticated users to the calculator page", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<div>Guest Login Page</div>} />
          </Route>
          <Route path={routes.calculator} element={<div>Calculator Page</div>} />
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

    expect(screen.getByText("Calculator Page")).toBeInTheDocument();
    expect(screen.queryByText("Guest Login Page")).not.toBeInTheDocument();
  });
});
