import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { articlesApi } from '@/services/api'

interface Article {
  id: number
  library_id: number
  designation: string
  lot: string
  sous_categorie?: string
  unite: string
  prix_unitaire: number | string
  statut?: string
}

interface ArticleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  article?: Article | null
  libraryId: number
}

const lots = [
  '1- TERRASSEMENTS GÉNÉRAUX',
  '2- GROS ŒUVRE - MAÇONNERIE',
  '3- MÉTALLERIE, FERRONNERIE',
  '4- PLÂTRERIE',
  '5- ISOLATION',
  '6- CARRELAGES, REVÊTEMENTS',
  '7- SOLS SOUPLES',
  '8- PEINTURES',
  '9- MENUISERIES INTÉRIEURES',
  '10- MENUISERIES EXTÉRIEURES',
  '11- ÉLECTRICITÉ COURANTS FORTS',
  '12- PLOMBERIES SANITAIRES',
  '13- COUVERTURE, ZINGUERIE',
  '14- ÉTANCHÉITÉ',
  '15- STORES ET FERMETURES',
  '16- VRD, ESPACES EXTÉRIEURS'
]

const unites = ['M2', 'M3', 'L', 'U']
const statuts = ['Nouveau', 'En cours', 'Validé']

export function ArticleModal({ open, onOpenChange, onSuccess, article, libraryId }: ArticleModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    designation: '',
    lot: '1- TERRASSEMENTS GÉNÉRAUX',
    sous_categorie: '',
    unite: 'M2',
    prix_unitaire: '',
    statut: 'Nouveau'
  })

  useEffect(() => {
    if (article) {
      setFormData({
        designation: article.designation || '',
        lot: article.lot || '1- TERRASSEMENTS GÉNÉRAUX',
        sous_categorie: article.sous_categorie || '',
        unite: article.unite || 'M2',
        prix_unitaire: article.prix_unitaire?.toString() || '',
        statut: article.statut || 'Nouveau'
      })
    } else {
      setFormData({
        designation: '',
        lot: '1- TERRASSEMENTS GÉNÉRAUX',
        sous_categorie: '',
        unite: 'M2',
        prix_unitaire: '',
        statut: 'Nouveau'
      })
    }
    setError('')
  }, [article, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const dataToSend = {
        ...formData,
        library_id: libraryId,
        prix_unitaire: parseFloat(formData.prix_unitaire)
      }

      if (article) {
        const response = await articlesApi.update(article.id, dataToSend)
        if (response.success) {
          onSuccess()
          onOpenChange(false)
        } else {
          setError(response.error || 'Erreur lors de la mise à jour de l\'article')
        }
      } else {
        const response = await articlesApi.create(dataToSend)
        if (response.success) {
          onSuccess()
          onOpenChange(false)
        } else {
          setError(response.error || 'Erreur lors de la création de l\'article')
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? 'Modifier l\'article' : 'Ajouter un article'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="designation">Désignation *</Label>
            <Input
              id="designation"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              required
              placeholder="Béton C25/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lot">Lot *</Label>
              <Select
                value={formData.lot}
                onValueChange={(value) => setFormData({ ...formData, lot: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot} value={lot}>
                      {lot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sous_categorie">Sous-catégorie</Label>
              <Input
                id="sous_categorie"
                value={formData.sous_categorie}
                onChange={(e) => setFormData({ ...formData, sous_categorie: e.target.value })}
                placeholder="Fondations"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unite">Unité *</Label>
              <Select
                value={formData.unite}
                onValueChange={(value) => setFormData({ ...formData, unite: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unites.map((unite) => (
                    <SelectItem key={unite} value={unite}>
                      {unite}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prix_unitaire">Prix unitaire (€) *</Label>
              <Input
                id="prix_unitaire"
                type="number"
                step="0.01"
                min="0"
                value={formData.prix_unitaire}
                onChange={(e) => setFormData({ ...formData, prix_unitaire: e.target.value })}
                required
                placeholder="120.50"
              />
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
                  {statuts.map((statut) => (
                    <SelectItem key={statut} value={statut}>
                      {statut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? 'Enregistrement...' : article ? 'Mettre à jour' : 'Ajouter l\'article'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
