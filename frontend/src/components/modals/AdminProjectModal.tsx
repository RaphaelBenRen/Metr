import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminApi } from '@/services/api'

interface Project {
  id: number
  nom_projet: string
  client: string
  reference_interne?: string
  typologie: string
  adresse?: string
  date_livraison_prevue?: string
  statut: string
  surface_totale?: number
  user_id: number
}

interface AdminProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  project: Project | null
}

const typologies = [
  'Maison individuelle',
  'Immeuble résidentiel',
  'Bureau',
  'Commerce',
  'Industriel',
  'Équipement public',
  'Autre'
]

const statuts = ['Brouillon', 'En cours', 'Terminé', 'Archivé']

export function AdminProjectModal({ open, onOpenChange, onSuccess, project }: AdminProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nom_projet: '',
    client: '',
    reference_interne: '',
    typologie: 'Maison individuelle',
    adresse: '',
    date_livraison_prevue: '',
    statut: 'Brouillon',
    surface_totale: ''
  })

  useEffect(() => {
    if (project) {
      setFormData({
        nom_projet: project.nom_projet || '',
        client: project.client || '',
        reference_interne: project.reference_interne || '',
        typologie: project.typologie || 'Maison individuelle',
        adresse: project.adresse || '',
        date_livraison_prevue: project.date_livraison_prevue || '',
        statut: project.statut || 'Brouillon',
        surface_totale: project.surface_totale?.toString() || ''
      })
    }
    setError('')
  }, [project, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!project) return

      const dataToSend = {
        ...formData,
        surface_totale: formData.surface_totale ? parseFloat(formData.surface_totale) : null
      }

      const response = await adminApi.updateProject(project.id, dataToSend)
      if (response.success) {
        onSuccess()
        onOpenChange(false)
      } else {
        setError(response.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="nom_projet">Nom du projet *</Label>
              <Input
                id="nom_projet"
                value={formData.nom_projet}
                onChange={(e) => setFormData({ ...formData, nom_projet: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_interne">Référence interne</Label>
              <Input
                id="reference_interne"
                value={formData.reference_interne}
                onChange={(e) => setFormData({ ...formData, reference_interne: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="typologie">Typologie *</Label>
              <Select
                value={formData.typologie}
                onValueChange={(value) => setFormData({ ...formData, typologie: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typologies.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => setFormData({ ...formData, statut: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuts.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_livraison_prevue">Date de livraison prévue</Label>
              <Input
                id="date_livraison_prevue"
                type="date"
                value={formData.date_livraison_prevue}
                onChange={(e) => setFormData({ ...formData, date_livraison_prevue: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surface_totale">Surface totale (m²)</Label>
              <Input
                id="surface_totale"
                type="number"
                step="0.01"
                value={formData.surface_totale}
                onChange={(e) => setFormData({ ...formData, surface_totale: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
