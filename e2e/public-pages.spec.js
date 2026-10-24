import { test, expect } from '@playwright/test'

test('home page shows the hero and all four categories', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('PrettyBooked')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Look good.')
  for (const name of ['Braider', 'Nail Tech', 'Lash Tech', 'Seamstress']) {
    await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible()
  }
})

test('Book now opens the braider list', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Book now' }).click()
  await expect(page).toHaveURL('/browse/braider')
  await expect(page).toHaveTitle('Braiders · PrettyBooked')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Braider')
})

test('each category page finishes loading', async ({ page }) => {
  for (const [slug, heading] of [
    ['braider', 'Braider'],
    ['nail-tech', 'Nail Tech'],
    ['lash-tech', 'Lash Tech'],
    ['seamstress', 'Seamstress'],
  ]) {
    await page.goto(`/browse/${slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    await expect(page.getByText('Loading…')).toBeHidden()
    await expect(page.getByText('Stylists could not be loaded')).toBeHidden()
  }
})

test('footer links open Privacy and Terms', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Privacy' }).click()
  await expect(page).toHaveTitle('Privacy policy · PrettyBooked')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy policy')

  await page.goto('/')
  await page.getByRole('link', { name: 'Terms' }).click()
  await expect(page).toHaveTitle('Terms of use · PrettyBooked')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms of use')
})

test('public pages load without errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  for (const path of ['/', '/browse/braider', '/login', '/signup', '/privacy', '/terms']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('pages fit the screen with no sideways scrolling', async ({ page }) => {
  for (const path of ['/', '/browse/braider', '/login', '/signup', '/privacy']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
