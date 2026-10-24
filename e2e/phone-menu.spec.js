import { test, expect } from '@playwright/test'

test.describe('phone menu', () => {
  test.skip(({ isMobile }) => !isMobile, 'The menu button only shows on small screens')

  test('opens, shows the sign in links and closes with Escape', async ({ page }) => {
    await page.goto('/')
    const button = page.getByRole('button', { name: 'Open menu' })
    await expect(button).toHaveAttribute('aria-expanded', 'false')

    await button.click()
    const menu = page.locator('#mobile-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Log in' })).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Sign up' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
  })

  test('closes after choosing a page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.locator('#mobile-menu').getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL('/signup')
    await expect(page.locator('#mobile-menu')).toBeHidden()
  })

  test('the menu button is big enough to tap', async ({ page }) => {
    await page.goto('/')
    const box = await page.getByRole('button', { name: 'Open menu' }).boundingBox()
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  })
})

test('desktop shows the links without a menu button', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop only')
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden()
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Log in' })).toBeVisible()
})
