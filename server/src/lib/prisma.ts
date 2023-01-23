import { PrismaClient } from '@prisma/client'

// conexão com o banco de dados
export const prisma = new PrismaClient({
  log: ['query']
})