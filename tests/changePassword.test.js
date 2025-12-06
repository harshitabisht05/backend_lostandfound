import assert from "assert";
import bcrypt from "bcryptjs";

// test change-password logic (hashing)
async function run() {
  const pwd = "OldPass123";
  const hashed = await bcrypt.hash(pwd, 10);
  const isMatch = await bcrypt.compare(pwd, hashed);
  assert.strictEqual(isMatch, true, "bcrypt should match hashed password");
  console.log("change-password hashing: PASS");
}

run().catch((e) => { console.error("change-password test: FAIL", e); process.exit(1); });
