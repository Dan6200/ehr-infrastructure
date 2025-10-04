//cspell:ignore trenarigroup trumpia
import { Page } from 'puppeteer'

export default async function (page: Page) {
  await page.goto('https://linkidlogin.com/admin')
  await page.screenshot({
    fullPage: true,
    path: `data/screenshots/1.jpg`,
  })
  await page.locator('input[name="username"]').fill('trenarigroup')
  await page.locator('input[name="password"]').fill('Exit2022!')
  await page.locator('input[type="submit"]').click()
  setTimeout(() => console.log('logged in'))
}
