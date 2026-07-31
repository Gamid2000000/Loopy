import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardEditorForm } from "./CardEditorForm";

it("keeps create disabled until required fields are valid", () => {
  const submit = vi.fn();
  render(<CardEditorForm loading={false} onCancel={vi.fn()} onSubmit={submit} />);
  expect(screen.getByLabelText("Лицевая сторона")).toBeRequired();
  expect(screen.getByRole("button", { name: "Создать" })).toBeDisabled();
  expect(submit).not.toHaveBeenCalled();
});

it("sends null when an edited optional value is cleared and does not submit unchanged data", async () => {
  const user = userEvent.setup();
  const submit = vi.fn();
  render(
    <CardEditorForm
      edit
      loading={false}
      onCancel={vi.fn()}
      onSubmit={submit}
      initial={{ front: "F", back: "B", example: "Example", note: "Note" }}
    />,
  );
  expect(screen.getByRole("button", { name: "Сохранить" })).toBeDisabled();
  await user.clear(screen.getByLabelText("Пример"));
  await user.clear(screen.getByLabelText("Заметка"));
  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(submit).toHaveBeenCalledWith({ example: null, note: null });
});
