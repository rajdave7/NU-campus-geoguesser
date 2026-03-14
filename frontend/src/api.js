const API_BASE = "http://localhost:4000";
const USE_MOCK = true;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getRandomPhoto() {
  if (USE_MOCK) {
    await sleep(500);
    return {
      photo: {
        id: "mock-photo-1",
        s3_url: "https://picsum.photos/800/500",
        caption: "Mock campus photo",
      },
    };
  }

  const response = await fetch(`${API_BASE}/game/photo`);
  if (!response.ok) {
    throw new Error("Failed to fetch random photo");
  }
  return response.json();
}

export async function submitGuess(payload) {
  if (USE_MOCK) {
    await sleep(700);
    return {
      message: "Guess submitted successfully",
      result: {
        game_session_id: "mock-session",
        photo_id: payload.photo_id,
        guessed_lat: payload.guessed_lat,
        guessed_lng: payload.guessed_lng,
        actual_lat: 42.056,
        actual_lng: -87.675,
        distance_meters: 120,
        score: 4380,
      },
    };
  }

  const response = await fetch(`${API_BASE}/game/guess`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to submit guess");
  }

  return response.json();
}

export async function getLeaderboard() {
  if (USE_MOCK) {
    await sleep(400);
    return {
      leaderboard: [
        { rank: 1, user_id: 1, username: "saket", total_score: 15420 },
        { rank: 2, user_id: 2, username: "alex", total_score: 14200 },
        { rank: 3, user_id: 3, username: "maya", total_score: 13650 },
        { rank: 4, user_id: 4, username: "jordan", total_score: 12000 },
        { rank: 5, user_id: 5, username: "sam", total_score: 11800 },
      ],
    };
  }

  const response = await fetch(`${API_BASE}/leaderboard`);
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }

  return response.json();
}

export async function uploadPhoto(payload) {
  if (USE_MOCK) {
    await sleep(700);
    return {
      message: "Photo uploaded successfully",
      photo: {
        id: "mock-upload-id",
        caption: payload.caption || null,
      },
    };
  }

  const response = await fetch(`${API_BASE}/photos/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to upload photo");
  }

  return response.json();
}