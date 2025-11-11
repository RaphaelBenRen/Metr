import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { projectsApi, librariesApi } from '@/services/api'
import { Loader2, Mail, UserPlus, X, Shield, Eye, Crown } from 'lucide-react'

interface SharedUser {
  id: number
  email: string
  nom: string
  prenom?: string
  role: 'viewer' | 'editor'
  shared_at: string
}

interface Owner {
  id: number
  email: string
  nom: string
  prenom?: string
}

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'project' | 'library'
  itemId: number
  itemName: string
  onSuccess?: () => void
}

export function ShareModal({ open, onOpenChange, type, itemId, itemName, onSuccess }: ShareModalProps) {
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('editor')
  const [owner, setOwner] = useState<Owner | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      loadSharedUsers()
    }
  }, [open, itemId])

  const loadSharedUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const api = type === 'project' ? projectsApi : librariesApi
      const response = await api.getSharedUsers(itemId)

      if (response.success && response.data) {
        setOwner(response.data.owner)
        setIsOwner(response.data.is_owner)
        setSharedUsers(response.data.shared_users || [])
      } else {
        setError(response.error || 'Erreur lors du chargement')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Veuillez saisir un email')
      return
    }

    setSharing(true)
    setError('')

    try {
      const api = type === 'project' ? projectsApi : librariesApi
      const response = await api.share(itemId, email.trim(), selectedRole)

      if (response.success) {
        setEmail('')
        setSelectedRole('editor')
        await loadSharedUsers()
        if (onSuccess) onSuccess()
      } else {
        setError(response.error || 'Erreur lors du partage')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du partage')
    } finally {
      setSharing(false)
    }
  }

  const handleChangeRole = async (userId: number, newRole: 'viewer' | 'editor') => {
    try {
      const api = type === 'project' ? projectsApi : librariesApi
      const response = await api.updateRole(itemId, userId, newRole)

      if (response.success) {
        await loadSharedUsers()
        if (onSuccess) onSuccess()
      } else {
        setError(response.error || 'Erreur lors de la modification')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification')
    }
  }

  const handleUnshare = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer l\'accès à cet utilisateur ?')) return

    try {
      const api = type === 'project' ? projectsApi : librariesApi
      const response = await api.unshare(itemId, userId)

      if (response.success) {
        await loadSharedUsers()
        if (onSuccess) onSuccess()
      } else {
        setError(response.error || 'Erreur lors du retrait')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du retrait')
    }
  }

  const getRoleLabel = (role: string) => {
    return role === 'editor' ? 'Peut modifier' : 'Lecture seule'
  }

  const getRoleIcon = (role: string) => {
    return role === 'editor' ? <Shield className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4 text-gray-500" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partager {type === 'project' ? 'le projet' : 'la bibliothèque'}</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">{itemName}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Share form - only if owner */}
          {isOwner && (
            <form onSubmit={handleShare} className="space-y-3">
              <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Inviter un collaborateur</p>
                  <p className="text-xs text-blue-700">Saisissez l'email de l'utilisateur à inviter</p>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="email@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={sharing}
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={(value: 'viewer' | 'editor') => setSelectedRole(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span>Peut modifier</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-500" />
                          <span>Lecture seule</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={sharing || !email.trim()}>
                    {sharing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Partage...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Partager
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {selectedRole === 'editor' ? 'L\'utilisateur pourra modifier ce contenu' : 'L\'utilisateur pourra seulement consulter ce contenu'}
                </p>
              </div>
            </form>
          )}

          {/* Users list */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Personnes ayant accès ({(owner ? 1 : 0) + sharedUsers.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Owner */}
                {owner && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-amber-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-semibold">
                        {owner.nom?.charAt(0)?.toUpperCase() || owner.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {owner.prenom && owner.nom ? `${owner.prenom} ${owner.nom}` : owner.nom || owner.email}
                          </p>
                          <Crown className="w-4 h-4 text-amber-600" title="Propriétaire" />
                        </div>
                        <p className="text-sm text-gray-600">{owner.email}</p>
                      </div>
                    </div>
                    <div className="text-sm text-amber-700 font-medium">Propriétaire</div>
                  </div>
                )}

                {/* Shared users */}
                {sharedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>
                      {isOwner
                        ? `Ce ${type === 'project' ? 'projet' : 'cette bibliothèque'} n'est partagé avec personne`
                        : 'Aucun autre utilisateur'}
                    </p>
                  </div>
                ) : (
                  sharedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {user.nom?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.nom || user.email}
                          </p>
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <Select
                            value={user.role}
                            onValueChange={(value: 'viewer' | 'editor') => handleChangeRole(user.id, value)}
                          >
                            <SelectTrigger className="w-[160px] h-8">
                              <div className="flex items-center gap-1.5">
                                {getRoleIcon(user.role)}
                                <span className="text-sm">{getRoleLabel(user.role)}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-blue-600" />
                                  <span>Peut modifier</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="viewer">
                                <div className="flex items-center gap-2">
                                  <Eye className="w-4 h-4 text-gray-500" />
                                  <span>Lecture seule</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            {getRoleIcon(user.role)}
                            <span>{getRoleLabel(user.role)}</span>
                          </div>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => handleUnshare(user.id)}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            title="Retirer l'accès"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
