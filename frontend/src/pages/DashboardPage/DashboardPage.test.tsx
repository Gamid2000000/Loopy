import { render, screen } from "@testing-library/react";
import { DashboardPage } from "./DashboardPage";
it("shows dashboard skeleton while data is loading", () => {
  render(<DashboardPage />);
  expect(screen.getAllByText("Главная").length).toBeGreaterThan(0);
});
