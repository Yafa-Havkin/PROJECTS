# SketchMind

A fullstack AI-powered drawing application that generates SVG drawings from natural language prompts.

## Overview

SketchMind allows users to describe what they want to draw in plain text (Hebrew or English), and the application automatically generates a vector drawing using a large language model.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** ASP.NET Core (.NET 10)
- **Database:** SQLite via Entity Framework Core (created automatically on first run)
- **AI:** LLM via OpenRouter API (with automatic fallback to alternative models on rate limit)

## Features

- Natural language drawing generation (Hebrew and English)
- Iterative drawing — add elements to an existing drawing
- Undo / Redo support
- Save and load drawings per user
- Send drawing via email
- User identity persisted in localStorage

## Getting Started

### Prerequisites

- .NET 10 SDK
- Node.js 18+

### Configuration

Fill in `SketchMind.Server/appsettings.json` (use `appsettings.example.json` as a reference):

```json
{
  "OpenRouter": {
    "ApiKey": "<YOUR_OPENROUTER_API_KEY>",
    "ModelName": "<MODEL_NAME>"
  },
  "SmtpSettings": {
    "Server": "smtp.gmail.com",
    "Port": "587",
    "SenderName": "SketchMind AI",
    "SenderEmail": "<YOUR_GMAIL>",
    "AppPassword": "<YOUR_GMAIL_APP_PASSWORD>"
  }
}
```

### Running the Application

The project uses **ASP.NET Core SPA Proxy** — running the backend is enough. It will automatically install dependencies and start the React frontend.

```bash
cd SketchMind.Server
dotnet run --launch-profile https
```

Open `https://localhost:60047` in your browser.
