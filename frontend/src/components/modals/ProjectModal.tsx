import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { projectsApi } from '@/services/api'
import type { Project } from '@/types'
import { FileText, Upload, X, File } from 'lucide-react'

interface ProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  project?: Project | null
  defaultFolderId?: number | null
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

interface UploadedDocument {
  id?: number
  type: 'plan' | 'document'
  file?: File
  filename?: string
  original_filename?: string
  file_size?: number
  created_at?: string
}

export function ProjectModal({ open, onOpenChange, onSuccess, project, defaultFolderId }: ProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('info')
  const [projectId, setProjectId] = useState<number | null>(null)
  const [plans, setPlans] = useState<UploadedDocument[]>([])
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [uploadingPlans, setUploadingPlans] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)

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
      setProjectId(project.id)
      loadDocuments(project.id)
    } else {
      setFormData({
        nom_projet: '',
        client: '',
        reference_interne: '',
        typologie: 'Maison individuelle',
        adresse: '',
        date_livraison_prevue: '',
        statut: 'Brouillon',
        surface_totale: ''
      })
      setProjectId(null)
      setPlans([])
      setDocuments([])
      setActiveTab('info')
    }
    setError('')
  }, [project, open])

  const loadDocuments = async (id: number) => {
    try {
      const response = await projectsApi.getDocuments(id)
      if (response.success && response.data) {
        const docs = response.data as UploadedDocument[]
        setPlans(docs.filter(d => d.type === 'plan'))
        setDocuments(docs.filter(d => d.type === 'document'))
      }
    } catch (err) {
      console.error('Error loading documents:', err)
    }
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

      if (project) {
        const response = await projectsApi.update(project.id, dataToSend)
        if (response.success) {
          onSuccess()
          onOpenChange(false)
        } else {
          setError(response.error || 'Erreur lors de la mise à jour du projet')
        }
      } else {
        // Add folder_id when creating new project
        const createData = {
          ...dataToSend,
          folder_id: defaultFolderId
        }
        const response = await projectsApi.create(createData)
        if (response.success && response.data) {
          const newProjectId = response.data.id
          setProjectId(newProjectId)

          // If we have pending files, upload them
          if (plans.length > 0 || documents.length > 0) {
            setActiveTab('plans')
            await uploadPendingFiles(newProjectId)
          } else {
            onSuccess()
            onOpenChange(false)
          }
        } else {
          setError(response.error || 'Erreur lors de la création du projet')
        }
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const uploadPendingFiles = async (newProjectId: number) => {
    try {
      // Upload plans
      for (const plan of plans.filter(p => p.file)) {
        if (plan.file) {
          await projectsApi.uploadDocument(newProjectId, 'plan', plan.file)
        }
      }

      // Upload documents
      for (const doc of documents.filter(d => d.file)) {
        if (doc.file) {
          await projectsApi.uploadDocument(newProjectId, 'document', doc.file)
        }
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError('Erreur lors de l\'upload des fichiers')
    }
  }

  const handleFileSelect = async (type: 'plan' | 'document', files: FileList | null) => {
    if (!files || files.length === 0) return

    const allowedExtensions = type === 'plan'
      ? ['dwg', 'pdf', 'dxf']
      : ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']

    const newFiles: UploadedDocument[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()?.toLowerCase()

      if (!ext || !allowedExtensions.includes(ext)) {
        setError(`Type de fichier non autorisé: ${file.name}`)
        continue
      }

      if (projectId) {
        // If project exists, upload immediately
        const setUploading = type === 'plan' ? setUploadingPlans : setUploadingDocs
        setUploading(true)
        try {
          const response = await projectsApi.uploadDocument(projectId, type, file)
          if (response.success && response.data) {
            newFiles.push({ ...response.data, type })
          }
        } catch (err) {
          setError(`Erreur lors de l'upload de ${file.name}`)
        }
        setUploading(false)
      } else {
        // Queue for later upload
        newFiles.push({
          type,
          file,
          original_filename: file.name,
          file_size: file.size
        })
      }
    }

    if (type === 'plan') {
      setPlans(prev => [...prev, ...newFiles])
    } else {
      setDocuments(prev => [...prev, ...newFiles])
    }

    if (projectId) {
      await loadDocuments(projectId)
    }
  }

  const handleDeleteDocument = async (doc: UploadedDocument, type: 'plan' | 'document') => {
    if (doc.id && projectId) {
      try {
        const response = await projectsApi.deleteDocument(doc.id)
        if (response.success) {
          if (type === 'plan') {
            setPlans(prev => prev.filter(p => p.id !== doc.id))
          } else {
            setDocuments(prev => prev.filter(d => d.id !== doc.id))
          }
        }
      } catch (err) {
        setError('Erreur lors de la suppression')
      }
    } else {
      // Remove from pending queue
      if (type === 'plan') {
        setPlans(prev => prev.filter(p => p.file !== doc.file))
      } else {
        setDocuments(prev => prev.filter(d => d.file !== doc.file))
      }
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const renderDocumentList = (docs: UploadedDocument[], type: 'plan' | 'document') => {
    const isUploading = type === 'plan' ? uploadingPlans : uploadingDocs

    return (
      <div className="space-y-3">
        {docs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun {type === 'plan' ? 'plan' : 'document'} ajouté
          </p>
        )}
        {docs.map((doc, index) => (
          <div
            key={doc.id || index}
            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {doc.original_filename || doc.file?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(doc.file_size || doc.file?.size)}
                  {doc.created_at && ` • ${new Date(doc.created_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteDocument(doc, type)}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {isUploading && (
          <div className="text-sm text-center text-muted-foreground py-2">
            Upload en cours...
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Modifier le projet' : 'Créer un nouveau projet'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="plans" disabled={!project && !projectId}>
              Plans {plans.length > 0 && `(${plans.length})`}
            </TabsTrigger>
            <TabsTrigger value="documents" disabled={!project && !projectId}>
              Documents {documents.length > 0 && `(${documents.length})`}
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-4">
            {error && (
              <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="nom_projet">Nom du projet *</Label>
                  <Input
                    id="nom_projet"
                    value={formData.nom_projet}
                    onChange={(e) => setFormData({ ...formData, nom_projet: e.target.value })}
                    required
                    placeholder="Villa moderne"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Input
                    id="client"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    required
                    placeholder="M. Dupont"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference_interne">Référence interne</Label>
                  <Input
                    id="reference_interne"
                    value={formData.reference_interne}
                    onChange={(e) => setFormData({ ...formData, reference_interne: e.target.value })}
                    placeholder="PRJ-2025-001"
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
                    placeholder="123 rue de la Paix, 75001 Paris"
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
                    placeholder="150.00"
                  />
                </div>
              </div>

              {!project && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Après la création du projet, vous pourrez ajouter des plans et documents dans les onglets suivants.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="plans" className="space-y-4">
              <div>
                <Label>Plans (DWG, PDF, DXF)</Label>
                <div className="mt-2">
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
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter des plans
                  </Button>
                </div>
              </div>

              {renderDocumentList(plans, 'plan')}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div>
                <Label>Documents (PDF, JPG, PNG, DOC, XLS)</Label>
                <div className="mt-2">
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
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter des documents
                  </Button>
                </div>
              </div>

              {renderDocumentList(documents, 'document')}
            </TabsContent>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Annuler
              </Button>
              {activeTab === 'info' && (
                <Button type="submit" variant="accent" disabled={loading}>
                  {loading ? 'Enregistrement...' : project ? 'Mettre à jour' : 'Créer le projet'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
