const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/api/classify", async (req, res) => {
  const { name } = req.query;

  // 422 — non-string (e.g. ?name[]=foo sends an array)
  if (name !== undefined && typeof name !== "string") {
    return res.status(422).json({
      status: "error",
      message: "Invalid type: name must be a string",
    });
  }

  // 400 — missing or empty
  if (!name || name.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Missing required query parameter: name",
    });
  }

  try {
    const response = await axios.get("https://api.genderize.io", {
      params: { name: name.trim() },
      timeout: 4500, // stay under 500ms processing + allow API time
    });

    const { gender, probability, count } = response.data;

    // Edge case — no prediction available
    if (!gender || count === 0) {
      return res.status(200).json({
        status: "error",
        message: "No prediction available for the provided name",
      });
    }

    const sample_size = count;
    const is_confident = probability >= 0.7 && sample_size >= 100;
    const processed_at = new Date().toISOString();

    return res.status(200).json({
      status: "success",
      data: {
        name: name.trim(),
        gender,
        probability,
        sample_size,
        is_confident,
        processed_at,
      },
    });
  } catch (error) {
    // Genderize API failed or unreachable
    if (error.response) {
      return res.status(502).json({
        status: "error",
        message: "Failed to fetch data from external API",
      });
    }

    if (error.request) {
      return res.status(502).json({
        status: "error",
        message: "External API did not respond in time",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
