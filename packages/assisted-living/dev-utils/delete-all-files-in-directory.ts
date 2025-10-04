import fs from 'fs/promises'
import path from 'path'

export default async function (directory: string) {
  try {
    // Read all files in the directory
    const files = await fs.readdir(directory)

    // Loop through and delete each file
    for (const file of files) {
      const filePath = path.join(directory, file)
      const stat = await fs.lstat(filePath)

      // Ensure it's a file (not a subdirectory)
      if (stat.isFile()) {
        await fs.unlink(filePath) // Delete the file
        console.log(`Deleted: ${file}`)
      }
    }
    console.log('All files deleted successfully!\n')
  } catch (err) {
    console.error(`Error deleting files: ${err?.toString()}`)
  }
}
