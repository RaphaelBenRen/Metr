import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { foldersApi } from '@/services/api'
import { Loader2 } from 'lucide-react'
import type { ProjectFolder } from '@/types'

interface FolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: ProjectFolder | null
  parentFolder?: ProjectFolder | null
  onSuccess?: () => void
}

export function FolderModal({ open, onOpenChange, folder, parentFolder, onSuccess }: FolderModalProps) {
  const [nom, setNom] = useState('')
  const [couleur, setCouleur] = useState('#6366f1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (folder) {
        setNom(folder.nom)
        setCouleur(folder.couleur)
      } else {
        setNom('')
        setCouleur('#6366f1')
      }
      setError('')
    }
  }, [open, folder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nom.trim()) {
      setError('Le nom du dossier est requis')
      return
    }

    setLoading(true)
    setError('')

    try {
      let response
      if (folder) {
        // Update existing folder
        response = await foldersApi.update(folder.id, { nom: nom.trim(), couleur })
      } else {
        // Create new folder
        response = await foldersApi.create({
          nom: nom.trim(),
          couleur,
          parent_folder_id: parentFolder?.id || null,
        })
      }

      if (response.success) {
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        setError(response.error || 'Une erreur est survenue')
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {folder ? 'Modifier le dossier' : 'Nouveau dossier'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nom">Nom du dossier</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Mon dossier"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="couleur">Couleur</Label>
            <div className="flex gap-2">
              <Input
                id="couleur"
                type="color"
                value={couleur}
                onChange={(e) => setCouleur(e.target.value)}
                className="w-20 h-10 cursor-pointer"
                disabled={loading}
              />
              <Input
                type="text"
                value={couleur}
                onChange={(e) => setCouleur(e.target.value)}
                placeholder="#6366f1"
                className="flex-1"
                disabled={loading}
              />
            </div>
          </div>

          {parentFolder && (
            <div className="text-sm text-gray-600">
              Dans le dossier : <span className="font-medium">{parentFolder.nom}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {folder ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
