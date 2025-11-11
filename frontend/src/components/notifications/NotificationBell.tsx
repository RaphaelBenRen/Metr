import { useEffect, useState } from 'react'
import { Bell, Check, X, Clock } from 'lucide-react'
import { notificationsApi } from '@/services/api'
import type { PendingShare } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function NotificationBell() {
  const [pendingShares, setPendingShares] = useState<PendingShare[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const loadNotifications = async () => {
    try {
      const response = await notificationsApi.getPendingShares()
      if (response.success && response.data) {
        setPendingShares(response.data)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAccept = async (shareId: number) => {
    setLoading(true)
    try {
      const response = await notificationsApi.acceptShare(shareId)
      if (response.success) {
        await loadNotifications()
      }
    } catch (error) {
      console.error('Error accepting share:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (shareId: number) => {
    setLoading(true)
    try {
      const response = await notificationsApi.rejectShare(shareId)
      if (response.success) {
        await loadNotifications()
      }
    } catch (error) {
      console.error('Error rejecting share:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "à l'instant"
    if (diffMins < 60) return `il y a ${diffMins} min`
    if (diffHours < 24) return `il y a ${diffHours}h`
    if (diffDays === 1) return 'hier'
    if (diffDays < 7) return `il y a ${diffDays} jours`
    return date.toLocaleDateString('fr-FR')
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {pendingShares.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-semibold">
              {pendingShares.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {pendingShares.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {pendingShares.length} invitation{pendingShares.length > 1 ? 's' : ''} en attente
              </p>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {pendingShares.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingShares.map((share) => (
                  <Card key={share.id} className="m-3 p-4 border border-blue-100 bg-blue-50/50">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Invitation à un projet
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-semibold">{share.owner_name}</span> vous invite à collaborer sur le projet{' '}
                          <span className="font-semibold">"{share.nom_projet}"</span>
                        </p>
                        <div className="text-xs text-gray-500 mb-3 space-y-1">
                          <p>Client: {share.client}</p>
                          <p>Rôle: {share.role === 'editor' ? 'Éditeur' : 'Lecteur'}</p>
                          <p>{formatDate(share.created_at)}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(share.id)}
                            disabled={loading}
                            className="flex-1"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(share.id)}
                            disabled={loading}
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Refuser
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
