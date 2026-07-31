import { render, screen } from "@testing-library/react";
import { AppErrorBoundary } from "./AppErrorBoundary";

function ThrowOnRender(): never {
  throw new Error("render crash");
}

it("catches render errors and shows recovery UI", () => {
  render(
    <AppErrorBoundary>
      <ThrowOnRender />
    </AppErrorBoundary>,
  );
  expect(screen.getByText("Что-то пошло не так")).toBeInTheDocument();
  expect(screen.getByText("Обновить страницу")).toBeInTheDocument();
  expect(screen.getByText("На главную")).toBeInTheDocument();
});
