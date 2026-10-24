import { test, expect } from '@playwright/test'

test('sign up asks you to pick student or stylist first', async ({ page }) => {
  await page.goto('/signup')
  await page.getByPlaceholder('Your full name').fill('Test Person')
  await page.getByPlaceholder('you@email.com').fill('test@example.com')
  await page.getByPlaceholder('At least 6 characters').fill('secret123')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('Please select if you are a student or provider.')).toBeVisible()
  await expect(page).toHaveURL('/signup')
})

test('sign up links to the Terms and Privacy pages', async ({ page }) => {
  await page.goto('/signup')
  await expect(page.getByRole('link', { name: 'Terms of use' })).toHaveAttribute('href', '/terms')
  await expect(page.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy')
})

test('log in and sign up pages link to each other', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('main').getByRole('link', { name: 'Sign up' }).click()
  await expect(page).toHaveURL('/signup')
})

const PRIVATE_PAGES = ['/bookings', '/dashboard', '/messages', '/messages/abc', '/admin', '/create-profile', '/leave-review', '/book/abc']

for (const path of PRIVATE_PAGES) {
  test(`signed out visitors to ${path} are sent to log in`, async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(path)
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    expect(errors).toEqual([])
  })
}
