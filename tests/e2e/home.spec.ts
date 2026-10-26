import { expect, test } from "@playwright/test";

test("serves the Loome frontend without a backend", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("loome");
  await expect(page.getByRole("heading", { name: "loome", exact: true })).toBeVisible();
  await expect(
    page.getByText("A programmable practice band for improvising and comping"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
