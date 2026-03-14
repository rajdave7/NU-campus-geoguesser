import { useEffect, useState } from "react";
import "./LeaderboardTab.css";

import { getLeaderboard } from "../api";

export default function LeaderboardTab() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setMessage("");
        const data = await getLeaderboard();
        setLeaderboard(data.leaderboard || []);
      } catch (error) {
        setMessage(error.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  function getMedalClass(rank) {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "default";
  }

  function getMedal(rank) {
    if (rank === 1) return "★";
    if (rank === 2) return "★";
    if (rank === 3) return "★";
    return "•";
  }

  return (
    <div className="leaderboard-tab">
      <div className="leaderboard-header">
        <h2>Leaderboard</h2>
        <p>Top players by total score.</p>
      </div>

      {loading && <p className="leaderboard-message">Loading leaderboard...</p>}

      {message && !loading && (
        <p className="leaderboard-message error-message">{message}</p>
      )}

      {!loading && !message && leaderboard.length === 0 && (
        <p className="leaderboard-message">No leaderboard data available yet.</p>
      )}

      {!loading && !message && leaderboard.length > 0 && (
        <div className="leaderboard-list">
          {leaderboard.map((player, index) => {
            const rank = player.rank || index + 1;
            const medalClass = getMedalClass(rank);

            return (
              <div key={player.user_id || `${player.username}-${rank}`} className="leaderboard-row">
                <div className="leaderboard-left">
                  <span className={`medal ${medalClass}`}>{getMedal(rank)}</span>
                  <span className="rank-number">{rank}</span>
                  <div className="player-meta">
                    <div className="player-name">{player.username}</div>
                    <div className="player-id">User ID: {player.user_id}</div>
                  </div>
                </div>

                <div className="leaderboard-score">{player.total_score}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}