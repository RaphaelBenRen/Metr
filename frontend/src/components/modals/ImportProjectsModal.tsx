import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Download, AlertCircle } from 'lucide-react'

interface ImportProjectsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ImportProjectsModal({ open, onOpenChange, onSuccess }: ImportProjectsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Veuillez sélectionner un fichier CSV')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError('')
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Veuillez sélectionner un fichier')
      return
    }

    setError('')
    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost/metr2/backend/api/projects/import.php', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        onSuccess()
        setTimeout(() => {
          onOpenChange(false)
        }, 2000)
      } else {
        setError(data.error || 'Erreur lors de l\'import')
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'import')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'nom_projet,client,typologie,reference_interne,adresse,date_livraison_prevue,statut,surface_totale\n' +
      'Villa Moderne,M. Dupont,Maison individuelle,PRJ-001,"123 rue de la Paix, 75001 Paris",2025-12-31,Brouillon,150.00\n' +
      'Immeuble Centre-Ville,SCI Paris,Immeuble résidentiel,PRJ-002,"456 avenue Victor Hugo, 75016 Paris",2026-06-30,En cours,1200.00'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template_projets.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClose = () => {
    setFile(null)
    setError('')
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer des projets depuis CSV</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3 text-sm text-success bg-success/10 border border-success/20 rounded-md">
              <p className="font-semibold">{result.imported} projet(s) importé(s) avec succès !</p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-destructive">Erreurs :</p>
                  <ul className="list-disc list-inside text-destructive">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">Besoin d'un modèle ?</p>
                <p className="text-xs text-blue-700">Téléchargez notre fichier CSV d'exemple</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Cliquez pour changer de fichier</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cliquez pour sélectionner un fichier CSV</p>
                    <p className="text-xs text-gray-500 mt-1">ou glissez-déposez le fichier ici</p>
                  </div>
                )}
              </label>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Format requis :</strong></p>
              <p>• Colonnes : nom_projet, client, typologie, reference_interne, adresse, date_livraison_prevue, statut, surface_totale</p>
              <p>• Les champs nom_projet, client et typologie sont obligatoires</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" disabled={loading || !file}>
              {loading ? 'Import en cours...' : 'Importer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
