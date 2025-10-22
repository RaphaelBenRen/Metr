import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { projectsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Download, Trash2, Upload, FileImage, FileSpreadsheet, Edit } from 'lucide-react'
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

export function ProjectDetailPage() {
  const navigate = useNavigate()

  // Get projectId from URL manually
  const getProjectIdFromUrl = () => {
    const path = window.location.pathname
    const match = path.match(/\/projects\/(\d+)/)
    return match ? parseInt(match[1]) : null
  }

  const projectId = getProjectIdFromUrl()

  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        setProject(projectResponse.data)
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

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return

    try {
      const response = await projectsApi.deleteDocument(docId)
      if (response.success) {
        loadProjectData()
      } else {
        alert(response.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const getFileIcon = (format: string) => {
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif']
    const docFormats = ['doc', 'docx', 'pdf']
    const spreadsheetFormats = ['xls', 'xlsx']

    if (imageFormats.includes(format.toLowerCase())) {
      return <FileImage className="w-6 h-6 text-blue-500" />
    } else if (spreadsheetFormats.includes(format.toLowerCase())) {
      return <FileSpreadsheet className="w-6 h-6 text-green-500" />
    } else {
      return <FileText className="w-6 h-6 text-gray-500" />
    }
  }

  const getFilePreview = (doc: Document) => {
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif']
    const pdfFormats = ['pdf']

    const fileUrl = `http://localhost/metr2/backend/uploads/projects/${projectId}/${doc.filename}`

    if (imageFormats.includes(doc.format.toLowerCase())) {
      return (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden group">
          <img
            src={fileUrl}
            alt={doc.original_filename}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%236b7280"%3EAperçu indisponible%3C/text%3E%3C/svg%3E'
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
            <Button
              size="sm"
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(fileUrl, '_blank')}
            >
              Voir en grand
            </Button>
          </div>
        </div>
      )
    } else if (pdfFormats.includes(doc.format.toLowerCase())) {
      return (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Fichier PDF</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => window.open(fileUrl, '_blank')}
            >
              Ouvrir le PDF
            </Button>
          </div>
        </div>
      )
    } else {
      return (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center">
            {getFileIcon(doc.format)}
            <p className="text-sm text-gray-600 mt-2">Aperçu indisponible</p>
            <p className="text-xs text-gray-500 mt-1">.{doc.format}</p>
          </div>
        </div>
      )
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return 'bg-green-100 text-green-800'
      case 'Brouillon':
        return 'bg-orange-100 text-orange-800'
      case 'Terminé':
        return 'bg-blue-100 text-blue-800'
      case 'Archivé':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Projet non trouvé'}</p>
          <Button onClick={() => navigate({ to: '/projects' })}>
            Retour aux projets
          </Button>
        </div>
      </div>
    )
  }

  const plans = documents.filter(d => d.type === 'plan')
  const otherDocuments = documents.filter(d => d.type === 'document')

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <h1 className="text-3xl font-bold font-heading text-gray-900">
              {project.nom_projet}
            </h1>
            <p className="text-gray-600">{project.client}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate({ to: `/projects/${projectId}/edit` })}
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(project.statut)}`}>
            {project.statut}
          </span>
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du projet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.typologie && (
              <div>
                <p className="text-sm text-gray-500">Typologie</p>
                <p className="font-medium">{project.typologie}</p>
              </div>
            )}
            {project.adresse && (
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-medium">{project.adresse}</p>
              </div>
            )}
            {project.surface_totale && (
              <div>
                <p className="text-sm text-gray-500">Surface totale</p>
                <p className="font-medium">{project.surface_totale} m²</p>
              </div>
            )}
            {project.reference_interne && (
              <div>
                <p className="text-sm text-gray-500">Référence interne</p>
                <p className="font-medium">{project.reference_interne}</p>
              </div>
            )}
            {project.date_livraison_prevue && (
              <div>
                <p className="text-sm text-gray-500">Date de livraison prévue</p>
                <p className="font-medium">
                  {new Date(project.date_livraison_prevue).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Date de création</p>
              <p className="font-medium">
                {new Date(project.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Section */}
      {plans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold font-heading text-gray-900">
              Plans ({plans.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {getFilePreview(doc)}

                  <div className="mt-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={doc.original_filename}>
                          {doc.original_filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.file_size)} • {doc.format.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const fileUrl = `http://localhost/metr2/backend/uploads/projects/${projectId}/${doc.filename}`
                          window.open(fileUrl, '_blank')
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {otherDocuments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold font-heading text-gray-900">
              Documents ({otherDocuments.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherDocuments.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {getFilePreview(doc)}

                  <div className="mt-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={doc.original_filename}>
                          {doc.original_filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.file_size)} • {doc.format.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const fileUrl = `http://localhost/metr2/backend/uploads/projects/${projectId}/${doc.filename}`
                          window.open(fileUrl, '_blank')
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Documents */}
      {plans.length === 0 && otherDocuments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Aucun document pour ce projet</p>
            <p className="text-sm text-gray-500">
              Les documents ajoutés lors de la création apparaîtront ici
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
