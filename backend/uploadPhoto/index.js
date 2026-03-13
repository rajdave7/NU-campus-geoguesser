const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");
const Busboy = require("busboy");

const s3 = new S3Client({ region: "us-east-2" });
const BUCKET = process.env.S3_BUCKET;

// Northwestern Evanston campus bounding box
const CAMPUS_BOUNDS = {
  latMin: 42.044, latMax: 42.065,
  lngMin: -87.685, lngMax: -87.668,
};

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

// ── Parse multipart/form-data (image + fields) ─────────────────────────────────
function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let fileBuffer = null;
    let fileContentType = "image/jpeg";
    let fileName = "upload.jpg";

    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body || "");

    const contentType =
      event.headers["content-type"] || event.headers["Content-Type"] || "";

    const bb = Busboy({ headers: { "content-type": contentType } });

    bb.on("file", (_field, file, info) => {
      fileName = info.filename || fileName;
      fileContentType = info.mimeType || fileContentType;
      const chunks = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => { fileBuffer = Buffer.concat(chunks); });
    });

    bb.on("field", (name, val) => { fields[name] = val; });
    bb.on("finish", () => resolve({ fields, fileBuffer, fileContentType, fileName }));
    bb.on("error", reject);

    bb.write(body);
    bb.end();
  });
}

// ── Main handler ───────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  try {
    const { fields, fileBuffer, fileContentType, fileName } =
      await parseMultipart(event);

    const { latitude, longitude, user_id, caption } = fields;

    // Validate image
    if (!fileBuffer || fileBuffer.length === 0) {
      return respond(400, { error: "No image file provided" });
    }

    // Validate coordinates
    if (!latitude || !longitude) {
      return respond(400, { error: "latitude and longitude are required" });
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return respond(400, { error: "Coordinates must be valid numbers" });
    }

    // Validate photo is on Northwestern campus
    if (
      lat < CAMPUS_BOUNDS.latMin || lat > CAMPUS_BOUNDS.latMax ||
      lng < CAMPUS_BOUNDS.lngMin || lng > CAMPUS_BOUNDS.lngMax
    ) {
      return respond(400, {
        error: "Location is outside Northwestern campus bounds",
        bounds: CAMPUS_BOUNDS,
      });
    }

    // Upload image to S3
    const photoId = uuidv4();
    const ext = fileName.split(".").pop().toLowerCase() || "jpg";
    const s3Key = `photos/${photoId}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: fileContentType,
      Metadata: {
        latitude: String(lat),
        longitude: String(lng),
        uploaded_by: user_id || "anonymous",
      },
    }));

    const s3Url = `https://${BUCKET}.s3.amazonaws.com/${s3Key}`;

    // Save metadata to MySQL
    const db = await getDb();
    await db.execute(
      `INSERT INTO photos (id, user_id, s3_key, s3_url, latitude, longitude, caption)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [photoId, user_id || null, s3Key, s3Url, lat, lng, caption || null]
    );
    await db.end();

    return respond(201, {
      message: "Photo uploaded successfully",
      photo: {
        id: photoId,
        s3_url: s3Url,
        latitude: lat,
        longitude: lng,
        caption: caption || null,
      },
    });

  } catch (err) {
    console.error("Upload error:", err);
    return respond(500, { error: "Internal server error", detail: err.message });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}