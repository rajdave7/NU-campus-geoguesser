const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");

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

// ── Distance calculation (Haversine) ───────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Score calculation ──────────────────────────────────────────────────────────
function calculateScore(distanceMeters) {
  const maxScore = 5000;
  const score = Math.round(maxScore * Math.exp(-distanceMeters / 200));
  return Math.max(0, score);
}

// ── Main handler ───────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  let db;

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { user_id, photo_id, guessed_lat, guessed_lng } = body;

    // Validate required fields
    if (!photo_id || guessed_lat === undefined || guessed_lng === undefined) {
      return respond(400, {
        error: "photo_id, guessed_lat, and guessed_lng are required",
      });
    }

    const guessLat = parseFloat(guessed_lat);
    const guessLng = parseFloat(guessed_lng);

    if (isNaN(guessLat) || isNaN(guessLng)) {
      return respond(400, {
        error: "guessed_lat and guessed_lng must be valid numbers",
      });
    }

    db = await getDb();

    // Fetch actual photo coordinates
    const [photoRows] = await db.execute(
      `SELECT id, latitude, longitude
       FROM photos
       WHERE id = ? AND is_approved = 1
       LIMIT 1;`,
      [photo_id]
    );

    if (!photoRows || photoRows.length === 0) {
      return respond(404, { error: "Approved photo not found" });
    }

    const photo = photoRows[0];
    const actualLat = parseFloat(photo.latitude);
    const actualLng = parseFloat(photo.longitude);

    // Calculate distance and score
    const distanceMeters = haversineDistance(
      guessLat,
      guessLng,
      actualLat,
      actualLng
    );

    const score = calculateScore(distanceMeters);
    const sessionId = uuidv4();

    // Save result to game_sessions
    await db.execute(
      `INSERT INTO game_sessions
       (id, user_id, photo_id, guessed_lat, guessed_lng, distance_meters, score)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        user_id || null,
        photo_id,
        guessLat,
        guessLng,
        distanceMeters,
        score,
      ]
    );

    return respond(200, {
      message: "Guess submitted successfully",
      result: {
        game_session_id: sessionId,
        photo_id: photo_id,
        guessed_lat: guessLat,
        guessed_lng: guessLng,
        actual_lat: actualLat,
        actual_lng: actualLng,
        distance_meters: distanceMeters,
        score: score,
      },
    });

  } catch (err) {
    console.error("Submit guess error:", err);
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