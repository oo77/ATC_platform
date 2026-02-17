import { f as executeQuery } from './nitro.mjs';
import { v4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
async function userEmailExists(email, excludeId) {
  let query = "SELECT id FROM users WHERE email = ?";
  const params = [email];
  const rows = await executeQuery(query, params);
  return rows.length > 0;
}
async function getUserById(id) {
  const rows = await executeQuery(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    password: row.password_hash
    // Map hash to password property required by User interface
  };
}
async function createUser(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO users (id, email, password_hash, name, role, phone, workplace, position, pinfl, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.email,
      data.password,
      data.name,
      data.role,
      data.phone || null,
      data.workplace || null,
      data.position || null,
      data.pinfl || null,
      now,
      now
    ]
  );
  return {
    id,
    email: data.email,
    password: data.password,
    name: data.name,
    role: data.role,
    phone: data.phone || null,
    workplace: data.workplace || null,
    position: data.position || null,
    pinfl: data.pinfl || null,
    created_at: now,
    updated_at: now
  };
}
async function updateUserPassword(userId, hashedPassword) {
  await executeQuery(
    "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    [hashedPassword, /* @__PURE__ */ new Date(), userId]
  );
}

export { userEmailExists as a, createUser as c, getUserById as g, hashPassword as h, updateUserPassword as u };
//# sourceMappingURL=userRepository.mjs.map
