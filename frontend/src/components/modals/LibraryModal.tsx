import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { librariesApi } from '@/services/api'

interface Library {
  id: number
  nom: string
  description?: string
  is_global?: number
}

interface LibraryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  library?: Library | null
}

export function LibraryModal({ open, onOpenChange, onSuccess, library }: LibraryModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nom: '',
    description: ''
  })

  useEffect(() => {
    if (library) {
      setFormData({
        nom: library.nom || '',
        description: library.description || ''
      })
    } else {
      setFormData({
        nom: '',
        description: ''
      })
    }
    setError('')
  }, [library, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (library) {
        const response = await librariesApi.update(library.id, formData)
        if (response.success) {
          onSuccess()
          onOpenChange(false)
        } else {
          setError(response.error || 'Erreur lors de la mise à jour de la bibliothèque')
        }
      } else {
        const response = await librariesApi.create(formData)
        if (response.success) {
          onSuccess()
          onOpenChange(false)
        } else {
          setError(response.error || 'Erreur lors de la création de la bibliothèque')
        }
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {library ? 'Modifier la bibliothèque' : 'Créer une nouvelle bibliothèque'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nom">Nom de la bibliothèque *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              placeholder="Ma bibliothèque de prix"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la bibliothèque"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? 'Enregistrement...' : library ? 'Mettre à jour' : 'Créer la bibliothèque'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
