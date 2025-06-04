/**
 * Utility functions for authentication and permission management
 */

import { prisma } from '@/lib/prisma';

/**
 * Get user permissions from database
 * @param {string} userId - The user ID
 * @param {string} primariaId - The primaria ID
 * @returns {Promise<string[]>} Array of permission names
 */
export async function getUserPermissions(userId, primariaId) {
  try {
    const utilizator = await prisma.utilizator.findFirst({
      where: {
        id: userId,
        primariaId: primariaId,
        activ: true
      },
      select: {
        roluri: {
          where: {
            activ: true
          },
          include: {
            rol: {
              select: {
                permisiuni: {
                  include: {
                    permisiune: {
                      select: {
                        nume: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!utilizator) {
      return [];
    }

    // Agregare permisiuni din toate rolurile active
    const permisiuniSet = new Set();
    utilizator.roluri.forEach(rolUtilizator => {
      rolUtilizator.rol.permisiuni.forEach(rp => {
        if (rp.permisiune && rp.permisiune.nume) {
          permisiuniSet.add(rp.permisiune.nume);
        }
      });
    });

    return Array.from(permisiuniSet);
  } catch (error) {
    console.error('Eroare la obținerea permisiunilor utilizatorului:', error);
    return [];
  }
}

/**
 * Check if user has required permission
 * @param {string[]} userPermissions - User's permissions array
 * @param {string|string[]} requiredPermissions - Required permission(s)
 * @returns {boolean} True if user has at least one of the required permissions
 */
export function hasPermission(userPermissions, requiredPermissions) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  return required.some(permission => userPermissions.includes(permission));
}
