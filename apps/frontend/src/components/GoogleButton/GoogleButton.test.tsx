import { render, screen } from "@testing-library/react";
import { GoogleButton } from "./GoogleButton";

describe("GoogleButton", () => {
  it("renders a link to backend OAuth when enabled", () => {
    render(<GoogleButton enabled />);

    const link = screen.getByRole("link", { name: /Продовжити з Google/ });
    expect(link).toHaveAttribute(
      "href",
      expect.stringMatching(/\/auth\/google$/),
    );
  });

  it("renders a disabled button with a hint when disabled", () => {
    render(<GoogleButton enabled={false} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Продовжити з Google/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription(
      "Вхід через Google недоступний у демо-середовищі",
    );
  });
});
