# Gender Classifier API

A REST API that wraps the [Genderize.io](https://genderize.io) API with input validation, confidence scoring, and clean structured responses.

## Live API

> Base URL: `https://YOUR-DEPLOYED-URL.up.railway.app`

Example: `GET /api/classify?name=James`

---

## Endpoint

### `GET /api/classify`

| Parameter | Type   | Required | Description          |
| --------- | ------ | -------- | -------------------- |
| `name`    | string | Yes      | The name to classify |

### Success Response `200`

```json
{
  "status": "success",
  "data": {
    "name": "James",
    "gender": "male",
    "probability": 0.99,
    "sample_size": 1234,
    "is_confident": true,
    "processed_at": "2026-04-13T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Cause                                      |
| ------ | ------------------------------------------ |
| `400`  | Missing or empty `name` parameter          |
| `422`  | `name` is not a string (e.g. array)        |
| `502`  | External Genderize API failed or timed out |
| `500`  | Unexpected internal error                  |

Edge case (unknown name):

```json
{
  "status": "error",
  "message": "No prediction available for the provided name"
}
```

---

## Confidence Logic

`is_confident` is `true` only when **both** conditions are met:

- `probability >= 0.7`
- `sample_size >= 100`

---

## Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/gender-classifier.git
cd gender-classifier

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# Server runs on http://localhost:3000
```

Test it:

```bash
curl "http://localhost:3000/api/classify?name=John"
```

---

## Deploy to Railway (Recommended)

1. Push this repo to GitHub (must be public)
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select your repo — Railway auto-detects Node and runs `npm start`
4. Go to **Settings → Networking → Generate Domain**
5. Your live URL is ready — paste it in the submission form

---

## Tech Stack

- **Node.js** + **Express**
- **Axios** for HTTP requests
- **cors** middleware
