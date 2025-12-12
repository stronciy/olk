API: Information News

Endpoints:
- GET `/api/information/news` — list
- GET `/api/information/news/[id]` — item
- POST `/api/information/news` — create (admin)
- PATCH `/api/information/news` — update (admin)
- DELETE `/api/information/news?id={id}` — trash (admin)

Request (POST):
{
  "title": "string (required)",
  "date": "YYYY-MM-DD HH:mm:ss (required)",
  "text": "string (1..250, required)",
  "summary": "string (optional)",
  "content": "HTML string (optional)",
  "draft": false,
  "category": "string (optional)",
  "coverUrl": "string (optional)",
  "previewUrl": "string (optional)"
}

Response (GET list):
{
  "data": {
    "news": [
      {
        "id": 1,
        "title": "string",
        "date": "YYYY-MM-DD HH:mm:ss",
        "text": "string",
        "summary": "string",
        "content": "HTML string",
        "draft": false,
        "category": "string",
        "coverUrl": "string",
        "previewUrl": "string",
        "position": 0,
        "createdAt": "YYYY-MM-DD HH:mm:ss",
        "updatedAt": "YYYY-MM-DD HH:mm:ss"
      }
    ]
  }
}
