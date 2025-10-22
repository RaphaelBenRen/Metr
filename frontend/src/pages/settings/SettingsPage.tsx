import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { usersApi } from '@/services/api'
import { User, Lock, CheckCircle, AlertCircle } from 'lucide-react'

export function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Formulaire profil
  const [profileData, setProfileData] = useState({
    nom: '',
    prenom: '',
    email: '',
    entreprise: '',
    telephone: ''
  })

  // Formulaire mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Charger les données utilisateur
  useEffect(() => {
    if (user) {
      setProfileData({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        entreprise: user.entreprise || '',
        telephone: user.telephone || ''
      })
    }
  }, [user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setLoading(true)

    try {
      const response = await usersApi.updateProfile(profileData)
      if (response.success) {
        setProfileSuccess('Profil mis à jour avec succès !')
        // Rafraîchir l'auth context
        window.location.reload()
      } else {
        setProfileError(response.error || 'Erreur lors de la mise à jour du profil')
      }
    } catch (error) {
      setProfileError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoadingPassword(true)

    try {
      const response = await usersApi.changePassword(passwordData.currentPassword, passwordData.newPassword)
      if (response.success) {
        setPasswordSuccess('Mot de passe modifié avec succès !')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setPasswordError(response.error || 'Erreur lors de la modification du mot de passe')
      }
    } catch (error) {
      setPasswordError('Une erreur est survenue')
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-3">
        <User className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-heading text-gray-900">Mon Compte</h1>
      </div>

      {/* Mon Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Mon profil
          </CardTitle>
          <CardDescription>
            Gérez vos informations personnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileSuccess && (
              <div className="p-3 text-sm text-success bg-success/10 border border-success/20 rounded-md flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {profileError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={profileData.nom}
                  onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={profileData.prenom}
                  onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entreprise">Entreprise</Label>
                <Input
                  id="entreprise"
                  value={profileData.entreprise}
                  onChange={(e) => setProfileData({ ...profileData, entreprise: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={profileData.telephone}
                  onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                  placeholder="0123456789"
                />
              </div>
            </div>

            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordSuccess && (
              <div className="p-3 text-sm text-success bg-success/10 border border-success/20 rounded-md flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {passwordError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe *</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                placeholder="Au moins 8 caractères"
              />
              <p className="text-xs text-gray-500">Le mot de passe doit contenir au moins 8 caractères</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" disabled={loadingPassword}>
              {loadingPassword ? 'Modification en cours...' : 'Changer le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Informations du compte */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Rôle :</span>
            <span className="font-medium">{user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Compte créé le :</span>
            <span className="font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Dernière mise à jour :</span>
            <span className="font-medium">
              {user?.updated_at ? new Date(user.updated_at).toLocaleDateString('fr-FR') : '-'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
