const API_BASE = "https://jtjk63mi46.execute-api.us-east-2.amazonaws.com/dev";

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function createUser(username, email) {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email }),
  });
  return handleResponse(res);
}

export async function getRandomPhoto(excludeIds = []) {
  const params = excludeIds.length > 0 ? `?exclude=${excludeIds.join(",")}` : "";
  const res = await fetch(`${API_BASE}/photos/random${params}`);
  return handleResponse(res);
}

export async function submitGuess(payload) {
  const res = await fetch(`${API_BASE}/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getLeaderboard() {
  const res = await fetch(`${API_BASE}/leaderboard`);
  return handleResponse(res);
}

export async function uploadPhoto(payload) {
  const res = await fetch(`${API_BASE}/photos/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}