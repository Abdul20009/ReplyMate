# ReplyMate — Backend

AI-powered reply suggestions for your DMs. ReplyMate reads the context of a conversation plus notes you've saved about a contact, and suggests a few natural replies — you decide if you want to use them. Nothing is sent automatically.

## Stack

- Node.js + Express
- MongoDB (Mongoose)
- JWT authentication
- Groq API (Llama 3.3 70B) for generating suggestions

## Features

- Secure signup/login with hashed passwords (bcrypt) and JWT-protected routes
- Per-user contact profiles — save notes and a tone preference for each person you message
- AI-generated reply suggestions based on recent conversation + contact context
- No message content is ever stored — only that a suggestion was requested, for usage tracking

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy the example file and fill in your own values:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `GROQ_API_KEY` | API key from [console.groq.com/keys](https://console.groq.com/keys) |
| `JWT_SECRET` | Any long random string, used to sign auth tokens |

### 3. Run the server
```bash
npm run dev
```
Visit `http://localhost:5000/api/health` — you should see a success response.

## API Overview

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/signup` | Create a new account |
| POST | `/login` | Log in, returns a JWT |

### Contacts — `/api/contacts` (requires `Authorization: Bearer <token>`)
| Method | Route | Description |
|---|---|---|
| POST | `/` | Create a contact profile |
| GET | `/` | List your contacts |
| PUT | `/:id` | Update a contact |
| DELETE | `/:id` | Delete a contact |

### Suggestions — `/api/suggest` (requires `Authorization: Bearer <token>`)
| Method | Route | Description |
|---|---|---|
| POST | `/` | Get 3 AI-generated reply suggestions for a conversation |

Example request body:
```json
{
  "contactId": "664f...",
  "messages": [
    { "sender": "them", "text": "You free this weekend?" },
    { "sender": "me", "text": "Depends, what's up?" }
  ]
}
```

## Notes

- Passwords are hashed via a Mongoose `pre("save")` hook — never stored in plain text.
- Every contact/suggestion query is scoped to `req.user.id`, so users can only ever access their own data.
- Message content sent to `/api/suggest` is used only to generate the response — it isn't persisted in the database.

## Roadmap

- Chrome extension to scrape conversation context from WhatsApp Web / Instagram DMs
- Rate limiting per user/plan
- OTP-based email verification (not yet implemented — MVP currently uses plain email/password)