import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Download, AlertCircle } from 'lucide-react'

interface ImportArticlesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ImportArticlesModal({ open, onOpenChange, onSuccess }: ImportArticlesModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [libraryName, setLibraryName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ library: any; imported: number; errors: string[] } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Veuillez sélectionner un fichier CSV')
        setFile(null)
        return
      }
      setFile(selectedFile)
      // Suggérer le nom du fichier (sans extension) comme nom de bibliothèque
      if (!libraryName) {
        const fileName = selectedFile.name.replace('.csv', '').replace(/_/g, ' ')
        setLibraryName(fileName)
      }
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
    if (!libraryName.trim()) {
      setError('Veuillez saisir un nom de bibliothèque')
      return
    }

    setError('')
    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('library_name', libraryName.trim())

      const response = await fetch('http://localhost/metr2/backend/api/libraries/import_complete.php', {
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
        }, 3000)
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
    const csvContent = 'designation,lot,sous_categorie,unite,prix_unitaire,statut\n' +
      'Béton C25/30,"1- TERRASSEMENTS GÉNÉRAUX",Fondations,M3,120.50,Nouveau\n' +
      'Brique creuse 20x20x40,"2- GROS ŒUVRE - MAÇONNERIE",Murs extérieurs,M2,35.00,Validé'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template_articles.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClose = () => {
    setFile(null)
    setLibraryName('')
    setError('')
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer une bibliothèque depuis CSV</DialogTitle>
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
              <p className="font-semibold">Bibliothèque "{result.library?.nom}" créée avec succès !</p>
              <p className="mt-1">{result.imported} article(s) importé(s)</p>
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
                <p className="text-sm font-medium text-blue-900">Exemples de bibliothèques</p>
                <p className="text-xs text-blue-700">Retrouvez des exemples dans backend/database/exemples_bibliotheques/</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Modèle CSV
              </Button>
            </div>

            {/* Nom de la bibliothèque */}
            <div className="space-y-2">
              <label htmlFor="library-name" className="text-sm font-medium text-gray-900">
                Nom de la bibliothèque <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="library-name"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                placeholder="Ex: Ma bibliothèque de gros œuvre"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-articles"
              />
              <label htmlFor="file-upload-articles" className="cursor-pointer">
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
              <p>• Colonnes : designation, lot, sous_categorie, unite, prix_unitaire, statut</p>
              <p>• Les champs designation, lot, unite et prix_unitaire sont obligatoires</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" disabled={loading || !file || !libraryName.trim()}>
              {loading ? 'Import en cours...' : 'Importer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
