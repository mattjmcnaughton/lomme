import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { EXAMPLE_TRACK } from "../../src/domain/tracks";

test("practice edits, explicit saves, stable rename, copy and reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Loome — Your practice band");
  await expect(page.locator("nav.presets button")).toHaveCount(100);
  await page.getByRole("slider", { name: "Tempo", exact: true }).fill("103");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("lomme-library"))).toBeNull();
  await page.getByRole("button", { name: "Save to library", exact: true }).click();
  await expect(page.locator("nav.presets button")).toHaveCount(101);
  const identity = await page.evaluate(
    () => JSON.parse(localStorage.getItem("pocket-session") ?? "{}").id,
  );
  await page.getByRole("button", { name: "Track details", exact: true }).click();
  await page.getByLabel("Track name", { exact: true }).fill("My evening practice");
  await page
    .getByLabel("Practice tags", { exact: true })
    .fill("voice leading, personal gem, personal gem");
  await page.getByRole("button", { name: "Save track details" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("nav.presets button")).toHaveCount(101);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("pocket-session") ?? "{}").id),
  ).toBe(identity);
  await page.getByRole("slider", { name: "Tempo", exact: true }).fill("67");
  await page.reload();
  await expect(page.getByRole("slider", { name: "Tempo", exact: true })).toHaveValue("67");
  await expect(page.getByRole("button", { name: "Play band", exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search tracks" }).fill("personal gem");
  await expect(page.locator("nav.presets button")).toHaveCount(1);
  await page.locator("nav.presets button").click();
  await expect(page.getByRole("slider", { name: "Tempo", exact: true })).toHaveValue("103");
  await page.getByRole("button", { name: "Save a copy", exact: true }).click();
  await expect(page.locator("nav.presets button")).toHaveCount(2);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("pocket-session") ?? "{}").id),
  ).not.toBe(identity);
  await page.getByRole("button", { name: "I'm feeling lucky", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Search tracks" })).toHaveValue("");
  await expect(page.locator("nav.presets button")).toHaveCount(102);
  expect(errors).toEqual([]);
});

test("legacy library upgrades preserve work and corrupt libraries cannot be overwritten", async ({
  page,
}) => {
  const legacy = JSON.parse(await readFile("tests/fixtures/soft-landing-v1.pocket.json", "utf8"));
  await page.addInitScript((track) => {
    if (!localStorage.getItem("lomme-library"))
      localStorage.setItem("lomme-library", JSON.stringify([track]));
  }, legacy);
  await page.goto("/");
  await expect(page.locator("nav.presets button")).toHaveCount(101);
  await page.getByRole("button", { name: /Soft landing Your track/ }).click();
  await expect(page.getByLabel("Keyboard rhythm")).toHaveValue("auto");
  await expect(page.getByRole("slider", { name: "Master volume", exact: true })).toHaveValue("75");
  await page.getByRole("slider", { name: "Tempo", exact: true }).fill("97");
  await page.getByRole("button", { name: "Save to library", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Arrangement saved");
  await page.reload();
  await expect(page.locator("nav.presets button")).toHaveCount(101);
  await expect(page.getByRole("slider", { name: "Tempo", exact: true })).toHaveValue("97");
  await page.evaluate(() => localStorage.setItem("lomme-library", "unreadable original data"));
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("library could not be read");
  await page.getByRole("button", { name: "Save to library", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("could not be saved");
  expect(await page.evaluate(() => localStorage.getItem("lomme-library"))).toBe(
    "unreadable original data",
  );
  await expect(page.getByRole("button", { name: "Play band", exact: true })).toBeVisible();
});

test("complete files round-trip, same-name imports are independent, invalid data is safe", async ({
  page,
}) => {
  const complete = {
    ...EXAMPLE_TRACK,
    bpm: 103,
    keysPattern: "arpeggio",
    master: 38,
    drumPattern: "funk",
    bassMotion: "moving",
    mode: "trade",
    countIn: false,
    metronome: true,
    showScale: true,
    metadata: {
      genres: ["Soul"],
      moods: ["Warm"],
      tags: ["voice leading"],
      difficulty: "intermediate",
    },
    mix: {
      drums: { volume: 17, muted: true },
      bass: { volume: 68.5, muted: false },
      keys: { volume: 52, muted: false },
    },
  };
  await page.goto("/");
  const upload = async (document: unknown) =>
    page.locator('input[type="file"]').setInputFiles({
      name: "practice.pocket.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(document)),
    });
  await upload(complete);
  await expect(page.locator(".session-heading h2")).toHaveText("Soft landing.");
  await page.reload();
  await expect(page.getByLabel("Keyboard rhythm")).toHaveValue("arpeggio");
  await expect(page.getByRole("checkbox", { name: "Count-in" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Show key scale" })).toBeChecked();
  await expect(page.getByRole("button", { name: "Toggle metronome" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const ready = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export track", exact: true }).click();
  const download = await ready;
  expect(JSON.parse(await readFile((await download.path()) as string, "utf8"))).toEqual(complete);
  await upload(complete);
  await expect(page.locator("nav.presets button")).toHaveCount(102);
  await upload({ ...complete, bpm: 999 });
  await expect(page.getByRole("alert")).toContainText("45 to 180 BPM");
  await expect(page.locator("nav.presets button")).toHaveCount(102);
  await expect(page.getByRole("slider", { name: "Tempo", exact: true })).toHaveValue("103");
  await page.getByRole("button", { name: "Bring your own AI", exact: true }).click();
  await expect(page.getByLabel("Complete prompt, example & JSON Schema")).toContainText(
    "MY REQUEST",
  );
});

test("real audio playback, split chords, long charts and stop remain synchronized", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.requestAnimationFrame = (callback) =>
      window.setTimeout(() => callback(performance.now()), 120);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  });
  await page.goto("/");
  await page.getByRole("checkbox", { name: "Count-in" }).uncheck();
  await page.getByRole("slider", { name: "Tempo", exact: true }).fill("180");
  for (let run = 0; run < 3; run++) {
    await page.getByRole("button", { name: "Play band", exact: true }).click();
    await expect(page.locator(".chart-footer")).toContainText("Bar 2", { timeout: 10_000 });
    await page.getByRole("button", { name: "Stop band", exact: true }).click();
    await page.waitForTimeout(300);
    await expect(page.locator(".chord-card.active")).toHaveAttribute("aria-label", "Bar 1: Gmaj7");
    await expect(page.locator(".transport-left strong")).toHaveText("Ready when you are.");
  }
  await page.getByRole("button", { name: /Autumn Leaves/ }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next 8 bars" }).click();
  await expect(page.locator(".chart-pages")).toContainText("Bars 25–32 of 32");
  await expect(page.getByRole("button", { name: "Bar 27: Gm7+C7", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Transpose up a semitone" }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next 8 bars" }).click();
  await expect(page.getByRole("button", { name: "Bar 27: Abm7+Db7", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /ii–V–I circuit/ }).click();
  await page.getByRole("checkbox", { name: "Count-in" }).uncheck();
  await page.getByRole("button", { name: "Play band", exact: true }).click();
  await expect(page.locator(".current-chord")).toHaveText("Dm7", { timeout: 10_000 });
  await expect(page.locator(".current-chord")).toHaveText("G7", { timeout: 10_000 });
  await expect(page.locator(".sounding-chord")).toHaveText("G7");
  await page.getByRole("button", { name: "Edit progression", exact: true }).click();
  await page.getByLabel("Your progression").fill("Am7+D7 Gmaj7 Cmaj7 Bm7 E7 Am7 D7 Gmaj7 Cmaj7");
  await page.getByRole("button", { name: "Use these changes" }).click();
  await expect(page.getByRole("button", { name: "Play band", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Bar 1: Am7+D7", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next 8 bars" }).click();
  await expect(page.locator(".chart-pages")).toContainText("Bars 9–9 of 9");
  expect(errors).toEqual([]);
});
