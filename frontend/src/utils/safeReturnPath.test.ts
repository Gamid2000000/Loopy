import { safeReturnPath } from "./safeReturnPath";

it("accepts only internal application paths for an auth return location", () => {
  expect(safeReturnPath("/forum")).toBe("/forum");
  expect(safeReturnPath("/forum/categories/general/new")).toBe("/forum/categories/general/new");
  expect(safeReturnPath("/forum/topics/42?page=1")).toBe("/forum/topics/42?page=1");
  expect(safeReturnPath("/dashboard?tab=today")).toBe("/dashboard?tab=today");
  expect(safeReturnPath("/forum/topics/42?page=2#reply")).toBe("/forum/topics/42?page=2#reply");
  expect(safeReturnPath("https://example.test")).toBeNull();
  expect(safeReturnPath("//example.test")).toBeNull();
  expect(safeReturnPath("\\\\example.test")).toBeNull();
  expect(safeReturnPath("/\\example.test")).toBeNull();
  expect(safeReturnPath("javascript:alert(1)")).toBeNull();
  expect(safeReturnPath("data:text/html,test")).toBeNull();
  expect(safeReturnPath("")).toBeNull();
  expect(safeReturnPath("   ")).toBeNull();
  expect(safeReturnPath(undefined)).toBeNull();
});
