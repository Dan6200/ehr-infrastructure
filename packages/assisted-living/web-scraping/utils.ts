import { Page } from 'puppeteer'

export async function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

export async function _locator(page: Page, selector: string) {
  await page.waitForSelector(selector)
  return page.$$(selector)
}
