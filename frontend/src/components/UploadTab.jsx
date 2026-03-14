import { useState } from "react";
import { uploadPhoto } from "../api";
import "./UploadTab.css";

export default function UploadTab() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [base64Image, setBase64Image] = useState("");
  const [caption, setCaption] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  function convertFileToBase64(selectedFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  async function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setMessage("");

    try {
      const encoded = await convertFileToBase64(selectedFile);
      setBase64Image(encoded);
    } catch {
      setMessage("Failed to process selected image.");
    }
  }

  async function handleUpload() {
    if (!file || !base64Image) {
      setMessage("Please select a photo first.");
      return;
    }

    if (!latitude || !longitude) {
      setMessage("Please enter latitude and longitude.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const payload = {
        user_id: userId ? Number(userId) : null,
        caption,
        latitude: Number(latitude),
        longitude: Number(longitude),
        image_base64: base64Image,
        file_name: file.name,
      };

      const data = await uploadPhoto(payload);
      setMessage(data.message || "Photo uploaded successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="upload-tab">
      <div className="upload-banner">
        <div className="upload-banner-content">
          <p className="upload-tag">Northwestern Campus Spotlight</p>
          <h2>Send us your favorite spot on campus.</h2>
          <p className="upload-subtext">
            Share a photo you love and we may feature it in the game for everyone
            to guess.
          </p>
        </div>
      </div>

      <div className="upload-card">
        <div className="upload-form-grid">
          <div className="upload-left">
            <label className="upload-label">Select Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="upload-file-input"
            />

            <label className="upload-label">Caption</label>
            <input
              type="text"
              placeholder="Optional caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="upload-input"
            />

            <label className="upload-label">User ID</label>
            <input
              type="number"
              placeholder="Enter user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="upload-input"
            />

            <div className="upload-coords">
              <div>
                <label className="upload-label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="42.0561"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="upload-input"
                />
              </div>

              <div>
                <label className="upload-label">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="-87.6750"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="upload-input"
                />
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="upload-button"
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>

            {message && <p className="upload-message">{message}</p>}
          </div>

          <div className="upload-right">
            <div className="upload-preview-box">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  className="upload-preview-image"
                />
              ) : (
                <div className="upload-preview-placeholder">
                  Your selected image preview will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}