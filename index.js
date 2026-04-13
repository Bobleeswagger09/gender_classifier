const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/api/classify", async (req, res) => {
  const name = req.query.name;

  // 422 — array or object
  if (name !== undefined && (Array.isArray(name) || typeof name === "object")) {
    return res.status(422).json({
      status: "error",
      message: "Invalid type: name must be a string",
    });
  }

  // 400 — missing or empty
  if (name === undefined || name === null || name.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Missing required query parameter: name",
    });
  }

  try {
    const response = await axios.get("https://api.genderize.io", {
      params: { name: name.trim() },
      timeout: 4500,
      // Accept all status codes so axios doesn't throw on non-2xx
      validateStatus: () => true,
    });

    const data = response.data;
    const gender = data.gender;
    const probability = data.probability;
    const count = data.count;

    // Edge case — no prediction available (unknown/nonsense names)
    if (
      !gender ||
      gender === null ||
      count === 0 ||
      count === null ||
      count === undefined
    ) {
      return res.status(200).json({
        status: "error",
        message: "No prediction available for the provided name",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        name: name.trim(),
        gender: gender,
        probability: probability,
        sample_size: count,
        is_confident: probability >= 0.7 && count >= 100,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error.request) {
      return res.status(502).json({
        status: "error",
        message: "External API did not respond in time",
      });
    }
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
