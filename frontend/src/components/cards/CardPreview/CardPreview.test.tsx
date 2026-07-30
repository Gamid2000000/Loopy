import { render, screen } from "@testing-library/react";
import { CardPreview } from "./CardPreview";

it("renders an archived list card with only the restore action", () => {
  render(
    <CardPreview
      card={{
        id: 1,
        front: "Archived front",
        back: "Archived back",
        status: "ARCHIVED",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
      }}
      onEdit={vi.fn()}
      onArchive={vi.fn()}
      onRestore={vi.fn()}
    />,
  );

  expect(screen.getByText("Archived front")).toBeInTheDocument();
  expect(screen.getByText("Archived back")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Восстановить" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Редактировать" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Архивировать" })).not.toBeInTheDocument();
});
