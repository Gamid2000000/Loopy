import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";
it("prevents repeated clicks while loading", async () => {
  const click = vi.fn();
  render(
    <Button loading onClick={click}>
      Сохранить
    </Button>,
  );
  await userEvent.click(screen.getByRole("button"));
  expect(click).not.toHaveBeenCalled();
  expect(screen.getByRole("button")).toBeDisabled();
});
