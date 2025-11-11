import { useEffect, useState, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { projectsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, X, Save, Trash2, FileText, Download } from 'lucide-react'
import type { Project } from '@/types'

interface Document {
  id: number
  type: 'plan' | 'document'
  filename: string
  original_filename: string
  file_size: number
  format: string
  created_at: string
}

interface PendingFile {
  file: File
  type: 'plan' | 'document'
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

const phases = ['Esquisse', 'Avant-projet', 'Avant-projet définitif']

const statuts = ['Brouillon', 'En cours', 'Terminé', 'Archivé']

export function EditProjectPage() {
  const navigate = useNavigate()

  // Get projectId from URL
  const getProjectIdFromUrl = () => {
    const path = window.location.pathname
    const match = path.match(/\/projects\/(\d+)\/edit/)
    return match ? parseInt(match[1]) : null
  }

  const projectId = getProjectIdFromUrl()

  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const planInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    nom_projet: '',
    client: '',
    reference_interne: '',
    typologie: 'Maison individuelle',
    phase: 'Esquisse',
    adresse: '',
    date_livraison_prevue: '',
    statut: 'Brouillon'
  })

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    } else {
      setError('ID de projet invalide')
      setLoading(false)
    }
  }, [projectId])

  const loadProjectData = async () => {
    if (!projectId) return

    try {
      setLoading(true)

      // Load project details
      const projectResponse = await projectsApi.get(projectId)
      if (projectResponse.success && projectResponse.data) {
        const proj = projectResponse.data
        setProject(proj)
        setFormData({
          nom_projet: proj.nom_projet || '',
          client: proj.client || '',
          reference_interne: proj.reference_interne || '',
          typologie: proj.typologie || 'Maison individuelle',
          phase: proj.phase || 'Esquisse',
          adresse: proj.adresse || '',
          date_livraison_prevue: proj.date_livraison_prevue || '',
          statut: proj.statut || 'Brouillon'
        })
      } else {
        setError(projectResponse.error || 'Projet non trouvé')
      }

      // Load documents
      const docsResponse = await projectsApi.getDocuments(projectId)
      if (docsResponse.success && docsResponse.data) {
        setDocuments(docsResponse.data)
      }
    } catch (err) {
      console.error('Error loading project:', err)
      setError('Erreur lors du chargement du projet')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) return

    setError('')
    setSaving(true)

    try {
      const response = await projectsApi.update(projectId, formData)

      if (response.success) {
        navigate({ to: `/projects/${projectId}` })
      } else {
        setError(response.error || 'Erreur lors de la mise à jour du projet')
      }
    } catch (err) {
      console.error('Erreur mise à jour projet:', err)
      setError('Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = (type: 'plan' | 'document', files: FileList | null) => {
    if (!files || files.length === 0) return

    const allowedExtensions = type === 'plan'
      ? ['dwg', 'pdf', 'dxf']
      : ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']

    const newFiles: PendingFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()?.toLowerCase()

      if (!ext || !allowedExtensions.includes(ext)) {
        setError(`Type de fichier non autorisé: ${file.name}`)
        continue
      }

      newFiles.push({ file, type })
    }

    setPendingFiles(prev => [...prev, ...newFiles])
  }

  const handleUploadPendingFiles = async () => {
    if (!projectId || pendingFiles.length === 0) return

    setUploading(true)
    setError('')

    try {
      for (const pending of pendingFiles) {
        const uploadResponse = await projectsApi.uploadDocument(projectId, pending.type, pending.file)
        if (!uploadResponse.success) {
          setError(`Erreur lors de l'upload de ${pending.file.name}: ${uploadResponse.error || 'Erreur inconnue'}`)
          setUploading(false)
          return
        }
      }

      // Clear pending files and reload documents
      setPendingFiles([])
      await loadProjectData()
    } catch (err) {
      console.error('Erreur upload fichiers:', err)
      setError('Une erreur est survenue lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return

    try {
      const response = await projectsApi.deleteDocument(docId)
      if (response.success) {
        setDocuments(prev => prev.filter(d => d.id !== docId))
      } else {
        setError(response.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      setError('Erreur lors de la suppression')
    }
  }

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate({ to: '/projects' })}>
            Retour aux projets
          </Button>
        </div>
      </div>
    )
  }

  const plans = documents.filter(d => d.type === 'plan')
  const otherDocuments = documents.filter(d => d.type === 'document')
  const pendingPlans = pendingFiles.filter(f => f.type === 'plan')
  const pendingDocs = pendingFiles.filter(f => f.type === 'document')

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
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <h1 className="text-2xl font-bold font-heading text-gray-900">
                Modifier le projet
              </h1>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              variant="accent"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="nom_projet" className="flex items-center gap-1">
                  <span className="text-red-500">*</span>
                  Nom du projet
                </Label>
                <Input
                  id="nom_projet"
                  value={formData.nom_projet}
                  onChange={(e) => setFormData({ ...formData, nom_projet: e.target.value })}
                  required
                  placeholder="Ex: Villa moderne"
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

              <div className="space-y-2">
                <Label htmlFor="phase" className="flex items-center gap-1">
                  <span className="text-red-500">*</span>
                  Phase du projet
                </Label>
                <Select
                  value={formData.phase}
                  onValueChange={(value) => setFormData({ ...formData, phase: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionnez une phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
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

              <div className="col-span-2 space-y-2">
                <Label htmlFor="adresse">Adresse du projet</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Ex: 12 Avenue des Plans, 75001 Paris"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_livraison_prevue">Date prévisionnelle de livraison</Label>
                <Input
                  id="date_livraison_prevue"
                  type="date"
                  value={formData.date_livraison_prevue}
                  onChange={(e) => setFormData({ ...formData, date_livraison_prevue: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plans ({plans.length + pendingPlans.length})</CardTitle>
              <div className="flex gap-2">
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
                  size="sm"
                  onClick={() => planInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter des plans
                </Button>
                {pendingPlans.length > 0 && (
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    onClick={handleUploadPendingFiles}
                    disabled={uploading}
                  >
                    {uploading ? 'Upload...' : `Uploader (${pendingPlans.length})`}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Existing plans */}
              {plans.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.original_filename}</p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(doc.file_size)} • {doc.format.toUpperCase()} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const fileUrl = `http://localhost/metr2/backend/uploads/projects/${projectId}/${doc.filename}`
                        window.open(fileUrl, '_blank')
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pending plans */}
              {pendingPlans.map((pending, index) => (
                <div key={`pending-${index}`} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pending.file.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(pending.file.size)} • En attente d'upload
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePendingFile(pendingFiles.indexOf(pending))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {plans.length === 0 && pendingPlans.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucun plan ajouté</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documents ({otherDocuments.length + pendingDocs.length})</CardTitle>
              <div className="flex gap-2">
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
                  size="sm"
                  onClick={() => docInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter des documents
                </Button>
                {pendingDocs.length > 0 && (
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    onClick={handleUploadPendingFiles}
                    disabled={uploading}
                  >
                    {uploading ? 'Upload...' : `Uploader (${pendingDocs.length})`}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Existing documents */}
              {otherDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.original_filename}</p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(doc.file_size)} • {doc.format.toUpperCase()} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const fileUrl = `http://localhost/metr2/backend/uploads/projects/${projectId}/${doc.filename}`
                        window.open(fileUrl, '_blank')
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pending documents */}
              {pendingDocs.map((pending, index) => (
                <div key={`pending-${index}`} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pending.file.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(pending.file.size)} • En attente d'upload
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePendingFile(pendingFiles.indexOf(pending))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {otherDocuments.length === 0 && pendingDocs.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucun document ajouté</p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
