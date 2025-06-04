'use client'

import { useState, useEffect } from 'react'

/**
 * Hook pentru obținerea datelor utilizatorului curent din token-ul de autentificare
 * @returns {Object} - Obiect cu datele utilizatorului sau null dacă nu este autentificat
 */
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getCurrentUser = () => {
      try {
        // În browser, nu putem accesa direct cookie-urile httpOnly
        // Dar putem face un request către un endpoint care să ne dea informațiile
        // Pentru moment, să încercăm să decodez token-ul dacă este disponibil în localStorage
        // sau să facem un request mic către server
        
        // Opțiunea 1: Request către server pentru datele utilizatorului
        fetchCurrentUserFromServer()
      } catch (error) {
        console.error('Eroare la obținerea utilizatorului curent:', error)
        setCurrentUser(null)
        setIsLoading(false)
      }
    }

  const fetchCurrentUserFromServer = async () => {
      try {
        console.log('useCurrentUser: Fetching user data from server...')
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Include cookies
        })

        if (response.ok) {
          const userData = await response.json()
          console.log('useCurrentUser: User data received:', userData)
          setCurrentUser(userData.data) // Extragem direct obiectul data din răspuns
        } else {
          console.error('useCurrentUser: Failed to fetch user data, status:', response.status)
          setCurrentUser(null)
        }
      } catch (error) {
        console.error('useCurrentUser: Error fetching user data:', error)
        setCurrentUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getCurrentUser()
  }, [])

  return { currentUser, isLoading }
}
