// src/context.ts
import { PrismaClient } from '@prisma/client';

// Instantiate Prisma Client
export const prisma = new PrismaClient();

// Define the context type
export interface GraphQLContext {
  prisma: PrismaClient;
}

// Function to create context for each request (can be extended later)
export async function createContext(): Promise<GraphQLContext> {
  return {
    prisma,
  };
}