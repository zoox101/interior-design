import { test, expect } from '@playwright/test';

async function dragCreate(page: any, from: { x: number; y: number }, to: { x: number; y: number }) {
  const room = page.locator('.room');
  const box = await room.boundingBox();
  if (!box) throw new Error('Room not found');
  await page.mouse.move(box.x + from.x, box.y + from.y);
  await page.mouse.down();
  await page.mouse.move(box.x + to.x, box.y + to.y);
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('clicking room does not create an object', async ({ page }) => {
  const room = page.locator('.room');
  const box = await room.boundingBox();
  if (!box) throw new Error('Room not found');
  const before = await page.locator('.furniture').count();
  await page.mouse.click(box.x + 80, box.y + 80);
  await expect(page.locator('.furniture')).toHaveCount(before);
});

test('dragging in room creates an object', async ({ page }) => {
  const before = await page.locator('.furniture').count();
  await dragCreate(page, { x: 90, y: 90 }, { x: 220, y: 190 });
  await expect(page.locator('.furniture')).toHaveCount(before + 1);
});

test('backspace deletes selected object', async ({ page }) => {
  await dragCreate(page, { x: 90, y: 90 }, { x: 220, y: 190 });
  const item = page.locator('.furniture').last();
  await item.click();
  const before = await page.locator('.furniture').count();
  await page.keyboard.press('Backspace');
  await expect(page.locator('.furniture')).toHaveCount(before - 1);
});

test('shift+click multi-select moves as group', async ({ page }) => {
  await dragCreate(page, { x: 60, y: 70 }, { x: 170, y: 170 });
  await dragCreate(page, { x: 230, y: 70 }, { x: 340, y: 170 });

  const items = page.locator('.furniture');
  await items.nth(0).click();
  await items.nth(1).click({ modifiers: ['Shift'] });

  await expect(page.locator('.furniture.selected')).toHaveCount(2);

  const firstBefore = await items.nth(0).boundingBox();
  const secondBefore = await items.nth(1).boundingBox();
  if (!firstBefore || !secondBefore) throw new Error('Missing item boxes');

  await page.mouse.move(firstBefore.x + 10, firstBefore.y + 10);
  await page.mouse.down();
  await page.mouse.move(firstBefore.x + 90, firstBefore.y + 40);
  await page.mouse.up();

  const firstAfter = await items.nth(0).boundingBox();
  const secondAfter = await items.nth(1).boundingBox();
  if (!firstAfter || !secondAfter) throw new Error('Missing item boxes after drag');

  expect(firstAfter.x).toBeGreaterThan(firstBefore.x + 20);
  expect(secondAfter.x).toBeGreaterThan(secondBefore.x + 20);
});

test('saved version selection auto-loads layout', async ({ page }) => {
  await dragCreate(page, { x: 60, y: 70 }, { x: 170, y: 170 });
  await page.getByPlaceholder('Living room option A').fill('v1');
  await page.getByRole('button', { name: 'Save As' }).click();

  await dragCreate(page, { x: 230, y: 80 }, { x: 300, y: 140 });
  const changedCount = await page.locator('.furniture').count();
  expect(changedCount).toBeGreaterThan(1);

  const versionSelect = page.locator('select').last();
  const versionValue = await versionSelect
    .locator('option', { hasText: 'v1' })
    .first()
    .getAttribute('value');
  if (!versionValue) throw new Error('Saved version option not found');
  await versionSelect.selectOption(versionValue);

  await expect(page.locator('.furniture')).toHaveCount(1);
});

test('hexagon shape exposes 8 resize handles when selected', async ({ page }) => {
  await dragCreate(page, { x: 90, y: 90 }, { x: 250, y: 250 });
  const item = page.locator('.furniture').first();
  await item.click();

  await page.locator('.shape-options button', { hasText: 'Hexagon' }).click();
  await expect(page.locator('.item-shape-hexagon')).toHaveCount(1);
  await expect(item.locator('.resize-handle')).toHaveCount(8);
});
