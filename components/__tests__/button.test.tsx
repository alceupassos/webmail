import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders a button with text", () => {
    render(<Button>Send</Button>);

    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("supports custom className", () => {
    render(<Button className="custom-class">Label</Button>);

    expect(screen.getByRole("button", { name: "Label" })).toHaveClass(
      "custom-class",
    );
  });
});
