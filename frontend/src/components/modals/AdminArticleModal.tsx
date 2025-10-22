import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { articlesApi } from '@/services/api'

interface Article {
  id: number
  designation: string
  lot: string
  unite: string
  prix_unitaire: number
  library_id: number
}

interface AdminArticleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  article: Article | null
}

const lots = [
  '1- TERRASSEMENTS GÉNÉRAUX',
  '2- GROS ŒUVRE - MAÇONNERIE',
  '3- CHARPENTE',
  '4- COUVERTURE - ÉTANCHÉITÉ',
  '5- BARDAGES - VÊTURES',
  '6- MENUISERIES EXTÉRIEURES',
  '7- CLOISONS - DOUBLAGES',
  '8- PLÂTRERIE - FAUX PLAFONDS',
  '9- REVÊTEMENTS DE SOLS SCELLÉS',
  '10- REVÊTEMENTS DE SOLS SOUPLES',
  '11- REVÊTEMENTS MURAUX',
  '12- PEINTURE - PRODUITS DÉCORATIFS',
  '13- MENUISERIES INTÉRIEURES',
  '14- ÉQUIPEMENTS DIVERS',
  '15- PLOMBERIE - SANITAIRES',
  '16- ÉLECTRICITÉ'
]

export function AdminArticleModal({ open, onOpenChange, onSuccess, article }: AdminArticleModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    designation: '',
    lot: lots[0],
    unite: 'U',
    prix_unitaire: ''
  })

  useEffect(() => {
    if (article) {
      setFormData({
        designation: article.designation || '',
        lot: article.lot || lots[0],
        unite: article.unite || 'U',
        prix_unitaire: article.prix_unitaire?.toString() || ''
      })
    }
    setError('')
  }, [article, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!article) return

      const dataToSend = {
        designation: formData.designation,
        lot: formData.lot,
        unite: formData.unite,
        prix_unitaire: parseFloat(formData.prix_unitaire)
      }

      const response = await articlesApi.update(article.id, dataToSend)
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

  if (!article) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier l'article</DialogTitle>
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
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prix_unitaire">Prix unitaire (€) *</Label>
              <Input
                id="prix_unitaire"
                type="number"
                step="0.01"
                value={formData.prix_unitaire}
                onChange={(e) => setFormData({ ...formData, prix_unitaire: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unite">Unité *</Label>
              <Input
                id="unite"
                value={formData.unite}
                onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                required
                placeholder="U, m², ml, etc."
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
