import { connectToDatabase } from './lib/db';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  try {
    await connectToDatabase();
    console.log("Success!");
    process.exit(0);
  } catch (e) {
    console.error("Failed:", e);
    process.exit(1);
  }
}
test();
