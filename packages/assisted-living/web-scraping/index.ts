//import deleteAllFilesInDirectory from "@/dev-utils/delete-all-files-in-directory.js";
import findCustomerData from './find-customer-data.js'
import login from './login.js'
import { page } from './set-browser.js'
import { delay } from './utils.js'

const ssNo = 0

//await deleteAllFilesInDirectory("data/screenshots");

let _page = page

while (true) {
  try {
    console.log('starting...')
    _page.setDefaultTimeout(500_000)
    await login(_page)
    await findCustomerData(_page, ssNo)
  } catch (e) {
    console.log('An error occurred!')
    console.error(e)
  } finally {
    await delay(30_000)
    _page.close()
    ;({ page: _page } = await import('./set-browser.js'))
  }
}
