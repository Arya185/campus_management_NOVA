import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/db";
import { AdminModel } from "../lib/models";

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || "NOVA Admin";

  if (!username || !email || !password) {
    throw new Error("Missing ADMIN_USERNAME, ADMIN_EMAIL, or ADMIN_PASSWORD.");
  }

  await connectToDatabase();

  const hashedPassword = await bcrypt.hash(password, 12);

  await AdminModel.findOneAndUpdate(
    { username },
    {
      username,
      email,
      name,
      role: "admin",
      password: hashedPassword,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Admin account ready for ${username}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  });
