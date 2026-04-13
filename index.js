const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/api/classify", async (req, res) => {
  const name = req.query.name;

  if (name !== undefined && (Array.isArray(name) || typeof name === "object")) {
    return res
      .status(422)
      .json({
        status: "error",
        message: "Invalid type: name must be a string",
      });
  }

  if (name === undefined || name === null || name.trim() === "") {
    return res
      .status(400)
      .json({
        status: "error",
        message: "Missing required query parameter: name",
      });
  }

  try {
    const response = await axios.get("https://api.genderize.io", {
      params: { name: name.trim() },
      timeout: 4500,
    });

    const { gender, probability, count } = response.data;

    if (gender === null || gender === undefined || count === 0) {
      return res
        .status(200)
        .json({
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
    if (error.response)
      return res
        .status(502)
        .json({
          status: "error",
          message: "Failed to fetch data from external API",
        });
    if (error.request)
      return res
        .status(502)
        .json({
          status: "error",
          message: "External API did not respond in time",
        });
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
