import puppeteer from 'puppeteer-extra'
import stealth from 'puppeteer-extra-plugin-stealth'

// Use Stealth plugin to avoid Captcha
puppeteer.use(stealth())

export const browser = await puppeteer.launch({
  //headless: "new",
  //headless: false,
  args: [
    // `--proxy-server=${anonProxy}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ],
  // ignoreHTTPSErrors: true,
  protocolTimeout: 1_000_000,
})

export const [page] = await browser.pages()
