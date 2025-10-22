import { useState, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { projectsApi } from '@/services/api'
import { ArrowLeft, Upload, X, FileText, File as FileIcon } from 'lucide-react'

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

interface UploadedFile {
  file: File
  type: 'plan' | 'document'
}

export function CreateProjectPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const planInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

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

  const [plans, setPlans] = useState<UploadedFile[]>([])
  const [documents, setDocuments] = useState<UploadedFile[]>([])

  const handleFileSelect = (type: 'plan' | 'document', files: FileList | null) => {
    if (!files || files.length === 0) return

    const allowedExtensions = type === 'plan'
      ? ['dwg', 'pdf', 'dxf']
      : ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']

    const newFiles: UploadedFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()?.toLowerCase()

      if (!ext || !allowedExtensions.includes(ext)) {
        setError(`Type de fichier non autorisé: ${file.name}`)
        continue
      }

      newFiles.push({ file, type })
    }

    if (type === 'plan') {
      setPlans(prev => [...prev, ...newFiles])
    } else {
      setDocuments(prev => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number, type: 'plan' | 'document') => {
    if (type === 'plan') {
      setPlans(prev => prev.filter((_, i) => i !== index))
    } else {
      setDocuments(prev => prev.filter((_, i) => i !== index))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const dataToSend = {
        ...formData,
        surface_totale: formData.surface_totale ? parseFloat(formData.surface_totale) : null
      }

      const response = await projectsApi.create(dataToSend)

      if (response.success && response.data) {
        const projectId = response.data.id

        // Upload plans
        for (const plan of plans) {
          const uploadResponse = await projectsApi.uploadDocument(projectId, 'plan', plan.file)
          if (!uploadResponse.success) {
            console.error('Erreur upload plan:', plan.file.name, uploadResponse)
            setError(`Erreur lors de l'upload du plan ${plan.file.name}: ${uploadResponse.error || 'Erreur inconnue'}`)
            return
          }
        }

        // Upload documents
        for (const doc of documents) {
          const uploadResponse = await projectsApi.uploadDocument(projectId, 'document', doc.file)
          if (!uploadResponse.success) {
            console.error('Erreur upload document:', doc.file.name, uploadResponse)
            setError(`Erreur lors de l'upload du document ${doc.file.name}: ${uploadResponse.error || 'Erreur inconnue'}`)
            return
          }
        }

        // Redirect to projects page
        navigate({ to: '/projects' })
      } else {
        setError(response.error || 'Erreur lors de la création du projet')
      }
    } catch (err) {
      console.error('Erreur création projet:', err)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/projects' })}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Créer un nouveau projet</h1>
                <p className="text-sm text-gray-600">Complétez les informations principales pour créer votre nouveau projet</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/projects' })}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                variant="accent"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer mon projet'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations du projet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations du projet</CardTitle>
              <p className="text-sm text-gray-600">Complétez les informations principales pour créer votre nouveau projet</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nom_projet" className="flex items-center gap-1">
                    <span className="text-red-500">*</span>
                    Nom du projet
                  </Label>
                  <Input
                    id="nom_projet"
                    value={formData.nom_projet}
                    onChange={(e) => setFormData({ ...formData, nom_projet: e.target.value })}
                    required
                    placeholder="Ex: Villa Méditerranée"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client" className="flex items-center gap-1">
                    <span className="text-red-500">*</span>
                    Client
                  </Label>
                  <Input
                    id="client"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    required
                    placeholder="Ex: Dupont Immobilier"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference_interne">Référence interne</Label>
                  <Input
                    id="reference_interne"
                    value={formData.reference_interne}
                    onChange={(e) => setFormData({ ...formData, reference_interne: e.target.value })}
                    placeholder="Ex: PRJ-2025-042"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typologie" className="flex items-center gap-1">
                    <span className="text-red-500">*</span>
                    Typologie projet
                  </Label>
                  <Select
                    value={formData.typologie}
                    onValueChange={(value) => setFormData({ ...formData, typologie: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Sélectionnez une typologie" />
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

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="adresse" className="flex items-center gap-1">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Adresse du projet
                  </Label>
                  <Input
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="Ex: 12 Avenue des Plans, 75001 Paris"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_livraison_prevue" className="flex items-center gap-1">
                    📅 Date prévisionnelle de livraison
                  </Label>
                  <Input
                    id="date_livraison_prevue"
                    type="date"
                    value={formData.date_livraison_prevue}
                    onChange={(e) => setFormData({ ...formData, date_livraison_prevue: e.target.value })}
                    className="h-12"
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
                    placeholder="150.00"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger className="h-12">
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
              </div>
            </CardContent>
          </Card>

          {/* Documents du projet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documents du projet</CardTitle>
              <p className="text-sm text-gray-600">Vous pouvez ajouter des plans et documents à tout moment</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plans Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Plans</h3>
                  <span className="text-sm text-gray-500">Formats recommandés: DWG, PDF</span>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Déposer vos plans ici</p>
                      <p className="text-sm text-gray-500 mt-1">Formats recommandés: DWG, PDF</p>
                    </div>
                    <input
                      ref={planInputRef}
                      type="file"
                      multiple
                      accept=".dwg,.pdf,.dxf"
                      onChange={(e) => handleFileSelect('plan', e.target.files)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => planInputRef.current?.click()}
                    >
                      <FileIcon className="w-4 h-4 mr-2" />
                      Parcourir les plans
                    </Button>
                  </div>
                </div>

                {plans.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {plans.map((plan, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileIcon className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{plan.file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(plan.file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index, 'plan')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {plans.length === 0 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Vous pourrez ajouter d'autres documents après la création du projet
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 my-6"></div>

              {/* Documents Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Documents</h3>
                  <span className="text-sm text-gray-500">PDF, JPG, PNG, DOC, XLS</span>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Déposer vos documents ici</p>
                      <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG, DOC, XLS</p>
                    </div>
                    <input
                      ref={docInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => handleFileSelect('document', e.target.files)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => docInputRef.current?.click()}
                    >
                      <FileIcon className="w-4 h-4 mr-2" />
                      Parcourir les documents
                    </Button>
                  </div>
                </div>

                {documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileIcon className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(doc.file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index, 'document')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons at bottom */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/projects' })}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={loading}
              className="min-w-[200px]"
            >
              {loading ? 'Création en cours...' : 'Créer mon projet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
