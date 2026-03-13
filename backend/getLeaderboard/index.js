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

    const [rows] = await db.execute(
      `SELECT 
          u.id,
          u.username,
          COALESCE(SUM(gs.score), 0) AS total_score
       FROM users u
       JOIN game_sessions gs ON u.id = gs.user_id
       GROUP BY u.id, u.username
       ORDER BY total_score DESC
       LIMIT 10`
    );

    return respond(200, {
      message: "Leaderboard fetched successfully",
      leaderboard: rows.map((row, index) => ({
        rank: index + 1,
        user_id: row.id,
        username: row.username,
        total_score: Number(row.total_score),
      })),
    });

  } catch (err) {
    console.error("Get leaderboard error:", err);
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