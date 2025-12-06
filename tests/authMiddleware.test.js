import assert from "assert";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";

// Simple unit test runner without external frameworks
async function run() {
  // Create a fake req/res/next
  const secret = process.env.JWT_SECRET || "testsecret";
  const token = jwt.sign({ id: "user123" }, secret, { expiresIn: "1h" });

  const req = { headers: { authorization: `Bearer ${token}` } };
  let called = false;
  const res = {
    status(code) {
      this._status = code;
      return this;
    },
    json(obj) {
      this._json = obj;
      return this;
    },
  };
  const next = () => { called = true; };

  await auth(req, res, next);
  assert.strictEqual(called, true, "auth middleware should call next for valid token");
  console.log("auth middleware: PASS");
}

run().catch((e) => { console.error("auth middleware: FAIL", e); process.exit(1); });
