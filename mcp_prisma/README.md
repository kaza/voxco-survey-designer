# Vite + React Chat App with Express/GraphQL TypeScript Backend

## Setup

### Client
```bash
cd client
npm install
npm run dev
```

### Server
```bash
cd server
npm install
npx prisma generate # Generate Prisma client and TypeGraphQL resolvers
npm run dev # Start server with hot reload
# OR
npm start # Start server
```

### Prisma Database
```bash
cd server
npx prisma studio # Open Prisma Studio to view/edit data
npx prisma migrate dev # Apply migrations (if needed)
npx prisma db seed # Seed the database (if needed)
```

## Endpoints

- Client application: http://localhost:5173
- Chat page: http://localhost:5173/chat
- API server: http://localhost:4000
- GraphQL endpoint: http://localhost:4000/graphql
- MCP SSE endpoint: http://localhost:4000/sse
- Test Prisma connection: http://localhost:4000/api/test-prisma
