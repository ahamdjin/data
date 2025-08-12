<h1 align="center">
DATAI - Hackathon AI Tinkerers 2025
</h1>

## About this project
**DATAI** is an AI-powered agent that lets non-technical users query a database using natural language without writing SQL. Built using Next.js, TailwindCSS, shadcn-ui, and Anthropic’s Claude API, this project focuses on simplicity, speed, and user-friendly design. Just ask a question like *“Who were my top customers last month?”* and DATAI will generate and execute the SQL query behind the scenes, returning accurate, clear results in real time.

## Demo video
[![See the demo on YouTube](https://img.youtube.com/vi/iE0RXjdbQsw/0.jpg)](https://youtu.be/iE0RXjdbQsw)

## Requisites ⚙️
To use the web interface, these requisites must be met:

1. **Node.js (18+)** and npm is required. [Download](https://nodejs.org/en/download)


## Quick start 🚀

**1. Clone the repository to a directory on your pc via command prompt:**

```
git clone https://github.com/toukoum/datai/
```

**2. Open the folder:**

```
cd datai
```

**3. Rename the `.example.env` to `.env`:**

```
mv .example.env .env
```

**5. Install dependencies:**

```
npm install
```

**6. Start the development server:**

```
npm run dev
```

**5. Go to [localhost:3000](http://localhost:3000) and start chatting with your DATA !**

# Database configuration

The application uses Postgres connection strings for database access. The
primary database should be provided via the `DATABASE_URL` environment
variable. To connect to multiple databases, define additional variables
following the pattern `DATABASE_URL_<NAME>` (for example,
`DATABASE_URL_ANALYTICS`). These named connections can be selected in code
using the provided `getAdapter` helper.

# Tech stack

[NextJS](https://nextjs.org/) - React Framework for the Web

[TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework

[shadcn-ui](https://ui.shadcn.com/) - UI component built using Radix UI and Tailwind CSS

[shadcn-chat](https://github.com/jakobhoeg/shadcn-chat) - Chat components for NextJS/React projects

[Framer Motion](https://www.framer.com/motion/) - Motion/animation library for React

[Lucide Icons](https://lucide.dev/) - Icon library


## Full Round-Trip FHIR Demo

```bash
npm install
npx prisma migrate dev --name add_fhir_embedding
npm run ingest:fhir -- --sample
npm run dev
```

## NoSQL Connectors

This project includes read-only connectors for MongoDB and Firestore. Both use a JSON-based query shape (no SQL required).

### MongoDB

```bash
curl -X POST http://localhost:3000/api/query/mongo \
  -H 'Content-Type: application/json' \
  -d '{
    "config": { "mongoUrl": "mongodb+srv://user:pass@cluster", "database": "sample_mflix" },
    "mongo": { "collection": "movies", "filter": {"year": {"$gte": 2015}}, "limit": 3 }
  }'
```

### Firestore

Set `FIREBASE_SERVICE_ACCOUNT_JSON` in your server environment to a service-account JSON string.

```bash
curl -X POST http://localhost:3000/api/query/firestore \
  -H 'Content-Type: application/json' \
  -d '{
    "firestore": { "collection": "articles", "where": [["published","==",true]], "limit": 5 }
  }'
```

