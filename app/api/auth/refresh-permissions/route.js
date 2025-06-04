/**
 * API endpoint to refresh user permissions
 * This can be called when user roles change to update the session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getUserPermissions } from '@/lib/auth-utils';

export async function POST(request) {
  try {
    // Get current session
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      );
    }

    // Get fresh permissions from database
    const permissions = await getUserPermissions(session.user.id, session.user.primariaId);

    // Return the updated permissions
    // Note: This doesn't automatically update the JWT token
    // The client should call this endpoint and then refresh their session
    return NextResponse.json({
      success: true,
      permissions: permissions,
      message: 'Permisiunile au fost actualizate. Te rugăm să te reconectezi pentru a aplica modificările.'
    });

  } catch (error) {
    console.error('Eroare la actualizarea permisiunilor:', error);
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    );
  }
}
