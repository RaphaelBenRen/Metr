import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { projectsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Download, Trash2, Upload, FileImage, FileSpreadsheet, Edit, Folder, Plus, X, Users, LogOut, Calculator } from 'lucide-react'
import type { Project, Library } from '@/types'
import { AssignLibrariesModal } from '@/components/modals/AssignLibrariesModal'
import { ShareModal } from '@/components/modals/ShareModal'

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

  // Get navigation source from URL search params
  const getFromSource = () => {
    const params = new URLSearchParams(window.location.search)
    const from = params.get('from')
    const fromFolder = params.get('from_folder')

    if (from === 'dashboard') {
      return { type: 'dashboard' as const }
    } else if (fromFolder) {
      return { type: 'folder' as const, folderId: parseInt(fromFolder) }
    }
    return { type: 'projects' as const }
  }

  const projectId = getProjectIdFromUrl()
  const fromSource = getFromSource()

  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [libraries, setLibraries] = useState<Library[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assignLibrariesModalOpen, setAssignLibrariesModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

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

      // Load libraries
      const librariesResponse = await projectsApi.getLibraries(projectId)
      if (librariesResponse.success && librariesResponse.data) {
        setLibraries(librariesResponse.data)
      }
    } catch (err) {
      console.error('Error loading project:', err)
      setError('Erreur lors du chargement du projet')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveLibrary = async (libraryId: number) => {
    if (!projectId) return
    if (!confirm('Êtes-vous sûr de vouloir retirer cette bibliothèque du projet ?')) return

    try {
      const response = await projectsApi.unassignLibrary(projectId, libraryId)
      if (response.success) {
        loadProjectData()
      } else {
        alert(response.error || 'Erreur lors du retrait')
      }
    } catch (error) {
      console.error('Error removing library:', error)
      alert('Erreur lors du retrait')
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

  const handleLeaveProject = async () => {
    if (!projectId) return
    if (!confirm('Êtes-vous sûr de vouloir quitter ce projet ? Vous perdrez l\'accès à tous les documents et données du projet.')) return

    try {
      const response = await projectsApi.leave(projectId)
      if (response.success) {
        if (fromSource.type === 'dashboard') {
          navigate({ to: '/dashboard' })
        } else if (fromSource.type === 'folder') {
          navigate({ to: '/projects', search: { folder: fromSource.folderId } })
        } else {
          navigate({ to: '/projects' })
        }
      } else {
        alert(response.error || 'Erreur lors de la sortie du projet')
      }
    } catch (error) {
      console.error('Error leaving project:', error)
      alert('Erreur lors de la sortie du projet')
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
            onClick={() => {
              if (fromSource.type === 'dashboard') {
                navigate({ to: '/dashboard' })
              } else if (fromSource.type === 'folder') {
                navigate({ to: '/projects', search: { folder: fromSource.folderId } })
              } else {
                navigate({ to: '/projects' })
              }
            }}
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
            onClick={() => {
              const search: any = {}
              if (fromSource.type === 'dashboard') {
                search.from = 'dashboard'
              } else if (fromSource.type === 'folder') {
                search.from_folder = fromSource.folderId
              }
              navigate({
                to: `/projects/${projectId}/chiffrage`,
                search: Object.keys(search).length > 0 ? search : undefined
              })
            }}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Chiffrage
          </Button>
          {project.is_owner ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShareModalOpen(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Partager
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: `/projects/${projectId}/edit` })}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </>
          ) : (
            <>
              {project.shared_role === 'editor' && (
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: `/projects/${projectId}/edit` })}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleLeaveProject}
                className="text-red-600 hover:text-red-700 hover:border-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Quitter le projet
              </Button>
            </>
          )}
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
            {project.phase && (
              <div>
                <p className="text-sm text-gray-500">Phase</p>
                <p className="font-medium text-blue-600">{project.phase}</p>
              </div>
            )}
            {project.adresse && (
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-medium">{project.adresse}</p>
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

      {/* Libraries Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Bibliothèques assignées ({libraries.length})
            </CardTitle>
            <Button
              variant="accent"
              size="sm"
              onClick={() => setAssignLibrariesModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Gérer les bibliothèques
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {libraries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Aucune bibliothèque assignée à ce projet</p>
              <p className="text-sm mt-1">
                Assignez des bibliothèques d'articles pour faciliter le chiffrage
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {libraries.map((library: any) => (
                <div
                  key={library.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group"
                >
                  <button
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveLibrary(library.id)}
                    title="Retirer cette bibliothèque"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Folder className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {library.nom}
                      </h3>
                      {library.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {library.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{library.article_count || 0} articles</span>
                        <span>
                          Assignée le {new Date(library.assigned_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Assign Libraries Modal */}
      {project && (
        <AssignLibrariesModal
          open={assignLibrariesModalOpen}
          onOpenChange={setAssignLibrariesModalOpen}
          projectId={projectId!}
          projectName={project.nom_projet}
          onSuccess={loadProjectData}
        />
      )}

      {/* Share Modal */}
      {project && (
        <ShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          type="project"
          itemId={projectId!}
          itemName={project.nom_projet}
          onSuccess={loadProjectData}
        />
      )}
    </div>
  )
}
