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

test('there is an explicit unusable-area creation control', async ({ page }) => {
  await expect(page.getByText(/unusable area/i)).toBeVisible();
});

test('hexagon can be moved flush to right wall', async ({ page }) => {
  await dragCreate(page, { x: 80, y: 80 }, { x: 260, y: 260 });
  const item = page.locator('.furniture').first();
  await item.click();
  await page.locator('.shape-options button', { hasText: 'Hexagon' }).click();

  const shape = item.locator('.item-shape').first();
  const room = page.locator('.room');

  const before = await shape.boundingBox();
  const roomBox = await room.boundingBox();
  if (!before || !roomBox) throw new Error('Missing geometry');

  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(roomBox.x + roomBox.width - 2, before.y + before.height / 2);
  await page.mouse.up();

  const after = await shape.boundingBox();
  if (!after) throw new Error('Missing post-drag geometry');

  // should be visually flush (allowing 1px rendering tolerance)
  expect(Math.abs(roomBox.x + roomBox.width - (after.x + after.width))).toBeLessThanOrEqual(1);
});

test('backspace works right after auto-loading a saved version from dropdown focus', async ({ page }) => {
  await dragCreate(page, { x: 60, y: 70 }, { x: 170, y: 170 });
  await page.getByPlaceholder('Living room option A').fill('focus-case');
  await page.getByRole('button', { name: 'Save As' }).click();

  const versionSelect = page.locator('select').last();
  const versionValue = await versionSelect
    .locator('option', { hasText: 'focus-case' })
    .first()
    .getAttribute('value');
  if (!versionValue) throw new Error('Saved version option not found');
  await versionSelect.selectOption(versionValue);

  await page.locator('.furniture').first().click();
  const before = await page.locator('.furniture').count();
  await page.keyboard.press('Backspace');
  await expect(page.locator('.furniture')).toHaveCount(before - 1);
});
