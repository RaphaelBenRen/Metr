import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import logoMetr from '@/assets/Metr. LOGO.png'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Vérifier si on revient de Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const googleLogin = params.get('google_login')

    if (googleLogin === 'success') {
      // Vérifier l'authentification après le retour de Google
      authApi.checkAuth().then(response => {
        if (response.success && response.data) {
          // Authentification réussie, rediriger vers le dashboard
          navigate({ to: '/dashboard' })
        } else {
          setError('Erreur lors de la vérification de la session')
        }
      }).catch(() => {
        setError('Impossible de vérifier la session')
      })

      // Nettoyer l'URL
      window.history.replaceState({}, '', '/login')
    } else if (googleLogin === 'error') {
      const message = params.get('message') || 'Erreur lors de la connexion Google'
      setError(decodeURIComponent(message))
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/login')
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        navigate({ to: '/dashboard' })
      } else {
        setError('Email ou mot de passe incorrect')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoMetr} alt="Metr." className="h-16" />
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Connexion
            </CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>

              {/* Séparateur */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continuer avec
                  </span>
                </div>
              </div>

              {/* Bouton Google */}
              <GoogleLoginButton onError={setError} />

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Pas encore de compte ?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/register' })}
                  className="text-primary hover:underline font-medium"
                >
                  S'inscrire
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-white/80">
          <p>&copy; 2025 Metr. - Tous droits réservés</p>
        </div>
      </div>
    </div>
  )
}
