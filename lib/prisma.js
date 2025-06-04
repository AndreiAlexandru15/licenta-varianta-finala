/**
 * Configurarea clientului Prisma pentru aplicația E-Registratură
 * @fileoverview Client Prisma singleton pentru conectarea la baza de date PostgreSQL
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

/**
 * Client Prisma singleton
 * @type {PrismaClient}
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Funcție pentru conectarea la baza de date
 * @returns {Promise<void>}
 */
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('✅ Conectat cu succes la baza de date PostgreSQL')
  } catch (error) {
    console.error('❌ Eroare la conectarea la baza de date:', error)
    throw new Error(`Database connection failed: ${error.message}`)
  }
}

/**
 * Funcție pentru deconectarea de la baza de date
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  try {
    await prisma.$disconnect()
    console.log('✅ Deconectat cu succes de la baza de date')
  } catch (error) {
    console.error('❌ Eroare la deconectarea de la baza de date:', error)
  }
}

export default prisma
