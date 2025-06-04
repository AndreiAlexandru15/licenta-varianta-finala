/**
 * API Route pentru obținerea datelor utilizatorului logat
 * @fileoverview Endpoint pentru obținerea informațiilor utilizatorului curent
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Helper function to convert BigInt to String for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

/**
 * GET /api/utilizatori/me
 * Obține detaliile utilizatorului logat
 */
export async function GET(request) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')
    const primariaId = headersList.get('x-primaria-id')
    
    if (!userId || !primariaId) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      )
    }

    // Obține utilizatorul curent cu detaliile relevante
    const utilizator = await prisma.utilizator.findFirst({
      where: {
        id: userId,
        primariaId: primariaId,
        activ: true
      },
      select: {
        id: true,
        nume: true,
        prenume: true,
        email: true,
        functie: true,
        telefon: true,
        activ: true,
        emailVerificat: true,
        createdAt: true,
        updatedAt: true,
        departamente: {
          where: {
            activ: true
          },
          include: {
            departament: {
              select: {
                id: true,
                nume: true,
                cod: true
              }
            }
          }
        },
        roluri: {
          where: {
            activ: true
          },
          include: {
            rol: {
              select: {
                id: true,
                nume: true,
                descriere: true
              }
            }
          }
        }
      }
    })

    if (!utilizator) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      )
    }

    return NextResponse.json(serializeBigInt({
      success: true,
      data: utilizator
    }))

  } catch (error) {
    console.error('Eroare la obținerea datelor utilizatorului curent:', error)
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}
