const mysql = require("mysql2/promise");

async function getDb() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "northwestern_geoguessr",
    ssl: { rejectUnauthorized: false },
  });
}

exports.handler = async (event) => {
  let db;
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { username, email } = body;

    if (!username || !email) {
      return respond(400, { error: "username and email are required" });
    }

    db = await getDb();

    // Check if user already exists
    const [existing] = await db.execute(
      `SELECT id, username, email, score FROM users WHERE username = ? OR email = ? LIMIT 1`,
      [username, email]
    );

    if (existing.length > 0) {
      // Return existing user instead of erroring
      return respond(200, { message: "User already exists", user: existing[0] });
    }

    const [result] = await db.execute(
      `INSERT INTO users (username, email) VALUES (?, ?)`,
      [username, email]
    );

    return respond(201, {
      message: "User created successfully",
      user: { id: result.insertId, username, email, score: 0 },
    });

  } catch (err) {
    console.error("Create user error:", err);
    return respond(500, { error: "Internal server error", detail: err.message });
  } finally {
    if (db) await db.end();
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}