import fs from 'fs/promises';
import path from 'path';

const ROOT_PATH = process.cwd();
const RESIDENTS_FILE = path.join(ROOT_PATH, 'demo-data', 'residents', 'data.json');
const AMG_INPUT_FILE = path.join(ROOT_PATH, 'dev-utils', 'amg-input.json');
const AVATARS_DIR = path.join(ROOT_PATH, 'public', 'avatars');

async function createAmgInput() {
  try {
    const residentsData = JSON.parse(await fs.readFile(RESIDENTS_FILE, 'utf-8'));
    const amgInputList = [];

    for (const resident of residentsData) {
      // Skip if avatarUrl already exists
      if (resident.data.avatarUrl) {
        continue;
      }

      const residentId = resident.id;
      const residentName = resident.data.encrypted_resident_name;
      
      const job = {
        prompt: `A portrait of a geriatric person named ${residentName}`,
        filepath: path.join(AVATARS_DIR, `${residentId}.png`),
        model_name: 'imagen-4', // Default model
        aspect_ratio: '1:1'     // Standard avatar aspect ratio
      };

      amgInputList.push(job);
    }

    await fs.writeFile(AMG_INPUT_FILE, JSON.stringify(amgInputList, null, 2));

    console.log(`Successfully created ${amgInputList.length} jobs in ${AMG_INPUT_FILE}`);

  } catch (error) {
    console.error("Error creating AMG input file:", error);
  }
}

createAmgInput();
