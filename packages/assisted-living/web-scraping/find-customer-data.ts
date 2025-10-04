// cspell:ignore trumpia ccyoung

import { Page } from 'puppeteer'
import getCustomerData from './get-customer-data.js'
import { browser } from './set-browser.js'
import Resident from './types.js'
import { delay, _locator } from './utils.js'

export default async function (page: Page, ssNo: number) {
  await page.screenshot({
    fullPage: true,
    path: `data/screenshots/${++ssNo}.jpg`,
  })
  await page.locator('a[href="/admin/MemberManagement/"]').click()
  await page.locator('input[name="search"]').fill('ccyoung')
  await page.locator('td > input[type="image"]').click()
  await page.locator('.basic_table tr > td').click()
  const buttons = await _locator(page, '.basic_table #button a')
  await buttons[0].click()
  await delay(30_000)
  const [, page2] = await browser.pages()
  page2.setDefaultTimeout(10_000_000)
  await page.close()
  await page2.screenshot({
    fullPage: true,
    path: `data/screenshots/${++ssNo}.jpg`,
  })
  await page2.locator('#btn_go_new_trumpia').click()
  await delay(50_000)
  await getCustomerData(page2, ssNo)
}
