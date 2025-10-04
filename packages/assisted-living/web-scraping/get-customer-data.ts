// cspell:ignore btns Keepsafe
import { appendFile, readFile, writeFile } from 'fs/promises'
import { Page } from 'puppeteer'
import Resident from './types.js'
import { delay, _locator } from './utils.js'

export default async function (page: Page, ssNo: number) {
  await page.screenshot({
    fullPage: true,
    path: `data/screenshots/${++ssNo}.jpg`,
  })
  await handlePasswordPrompt(page)
  await page.select('#base-select', '100')
  await delay(2_000)
  let residentCount = parseInt(
    (await readFile('data/last_count.txt', 'utf8')).toString(),
  )
  let pageNo = parseInt(
    (await readFile('data/last_page.txt', 'utf8')).toString(),
  )

  while (await page.$('.btn-range-next')) {
    for (let i = 1; i < pageNo; i++) {
      await handlePasswordPrompt(page)
      await page.locator('.btn-range-next').click()
      await delay(2_000)
    }
    let count = 2 + (residentCount % 100) * 7

    while (pageNo <= 3) {
      await delay(30_000)
      await page.screenshot({
        fullPage: true,
        path: `data/screenshots/${++ssNo}.jpg`,
      })
      await handlePasswordPrompt(page)
      await delay(30_000)
      let tableBtns = await _locator(page, 'td')
      let maxCount = tableBtns.length
      console.log(pageNo, count, maxCount)
      if (count > maxCount) {
        if (pageNo > 3) return
        count = 2
        console.log('next page...')
        await writeFile('data/last_page.txt', (++pageNo).toString())
        await handlePasswordPrompt(page)
        await page.locator('.btn-range-next').click()
        continue
      } else {
        await handlePasswordPrompt(page)
        await tableBtns[count].click()
        await delay(30_000)
      }
      await handlePasswordPrompt(page)
      const data = await getData(page)
      if (!data.length) throw new Error('Empty data')
      const resId = await getResId(data)
      const address = await getAddress(data)
      const name = await getResidentName(data)
      const addressData = address.split(' ')
      const room =
        addressData[addressData.length - 1].match(/(#\d+|\d+).*/g)?.[0]
      const emergencyContact = await getEmergencyContact(data)
      const resident: Resident = {
        name,
        noOfEmergencyContacts: emergencyContact?.length ?? 0,
        resId,
        address,
        room: room,
        emergencyContact,
      }
      await writeFile('data/last_count.txt', (++residentCount).toString())
      await appendFile(
        'data/raw_data.json',
        JSON.stringify(resident, null, 2) + ',',
      )
      await handlePasswordPrompt(page)
      await page.locator('.btn-header-back').click()
      await delay(5_000)
      await handlePasswordPrompt(page)
      await page.select('#base-select', '100')
      await delay(5_000)
      // Go back to the right page
      for (let i = 1; i < pageNo; i++) {
        if (pageNo > 3) return
        await handlePasswordPrompt(page)
        await page.locator('.btn-range-next').click()
        await delay(2_000)
      }
      count += 7
    }
  }
}

async function getEmergencyContact(data: any[]) {
  return (
    data[5]?.match(
      /.*(\+?\d{1,3} )?(\(\d{3}\)|\d{3})(-| )\d{3}(-| )\d{4}.*/g,
    ) ?? []
  )
}

async function getResidentName(data: any[]) {
  return data[5]
    ?.match(/Resident.*/)?.[0]
    .split(':')
    .map((s: any) => s.trim())[1]
}

async function getData(page: Page) {
  await page.waitForSelector('dl > dd p')
  return page.$$eval('dl > dd p', (el: any[]) => el.map((el) => el.textContent))
}

async function getAddress(data: any[]) {
  return data[1]
}

async function getResId(data: any[]) {
  return data[0].split(' ')[0]
}

async function handlePasswordPrompt(page: Page) {
  if (await page.$('.popup')) {
    await page.locator('.popup input.input').fill('Keepsafe1!')
    await page.locator('.popup-foot .btn-console .color-type01').click()
  }
}
