import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export function Header() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    // Format date in French
    const formatDate = () => {
      const date = new Date()
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
      return date.toLocaleDateString('fr-FR', options)
    }

    setCurrentDate(formatDate())

    // Update date at midnight
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    const timeoutId = setTimeout(() => {
      setCurrentDate(formatDate())
      // Then update every 24 hours
      const intervalId = setInterval(() => {
        setCurrentDate(formatDate())
      }, 24 * 60 * 60 * 1000)

      return () => clearInterval(intervalId)
    }, msUntilMidnight)

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      {/* Welcome message and date */}
      <div className="flex-1">
        {user && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Bienvenue {user.prenom} 👋
            </h2>
            <p className="text-sm text-gray-600 capitalize">{currentDate}</p>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationBell />

        {/* User info */}
        {user && (
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
