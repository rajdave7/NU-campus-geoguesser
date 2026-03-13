const mysql = require("mysql2/promise");

// ── DB connection ──────────────────────────────────────────────────────────────
async function getDb() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "northwestern_geoguessr",
    ssl: { rejectUnauthorized: false },
  });
}

// ── Main handler ───────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  let db;

  try {
    db = await getDb();

    // Step 1: count approved photos
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS count
       FROM photos
       WHERE is_approved = 1`
    );

    const totalApproved = countRows[0].count;

    if (totalApproved === 0) {
      return respond(404, { error: "No approved photos available" });
    }

    // Step 2: choose a random offset
    const randomOffset = Math.floor(Math.random() * totalApproved);

    // Step 3: fetch one approved photo at that offset
    const [rows] = await db.execute(
      `SELECT id, s3_url, caption
       FROM photos
       WHERE is_approved = 1
       LIMIT 1 OFFSET ?`,
      [randomOffset]
    );

    if (!rows || rows.length === 0) {
      return respond(404, { error: "No approved photos available" });
    }

    const photo = rows[0];

    return respond(200, {
      message: "Random photo fetched successfully",
      photo: {
        id: photo.id,
        s3_url: photo.s3_url,
        caption: photo.caption || null,
      },
    });

  } catch (err) {
    console.error("Get random photo error:", err);
    return respond(500, { error: "Internal server error", detail: err.message });
  } finally {
    if (db) {
      await db.end();
    }
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}