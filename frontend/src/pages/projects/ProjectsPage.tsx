import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { projectsApi, foldersApi, statisticsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Upload, FolderPlus, Folder, ArrowLeft, MoreVertical, Edit, Trash2, FolderOpen, FileText, Move, FolderClosed } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Project, ProjectFolder } from '@/types'
import { ProjectModal } from '@/components/modals/ProjectModal'
import { ImportProjectsModal } from '@/components/modals/ImportProjectsModal'
import { FolderModal } from '@/components/modals/FolderModal'
import { MoveFolderModal } from '@/components/modals/MoveFolderModal'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [folders, setFolders] = useState<ProjectFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)

  // Modals
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null)
  const [parentFolder, setParentFolder] = useState<ProjectFolder | null>(null)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [itemToMove, setItemToMove] = useState<{ type: 'project' | 'folder', id: number } | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    loadData()
    // Check if there's a folder parameter in URL
    const params = new URLSearchParams(window.location.search)
    const folderId = params.get('folder')
    if (folderId) {
      setCurrentFolderId(parseInt(folderId))
      // Clean URL after navigation
      window.history.replaceState({}, '', '/projects')
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectsResponse, foldersResponse, statsResponse] = await Promise.all([
        projectsApi.list(),
        foldersApi.list(),
        statisticsApi.getUserStats(),
      ])

      if (projectsResponse.success && projectsResponse.data) {
        setProjects(projectsResponse.data)
      }

      if (foldersResponse.success && foldersResponse.data) {
        setFolders(foldersResponse.data)
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = () => {
    setSelectedProject(null)
    setProjectModalOpen(true)
  }

  const handleProjectClick = (project: Project) => {
    navigate({
      to: `/projects/${project.id}`,
      search: currentFolderId ? { from_folder: currentFolderId } : {}
    })
  }

  const handleCreateFolder = () => {
    setEditingFolder(null)
    const parent = currentFolderId ? folders.find(f => f.id === currentFolderId) : null
    setParentFolder(parent || null)
    setFolderModalOpen(true)
  }

  const handleEditFolder = (folder: ProjectFolder) => {
    setEditingFolder(folder)
    setParentFolder(null)
    setFolderModalOpen(true)
  }

  const handleDeleteFolder = async (folder: ProjectFolder) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le dossier "${folder.nom}" ? Les projets seront déplacés vers "Mes projets".`)) {
      return
    }

    try {
      const response = await foldersApi.delete(folder.id)
      if (response.success) {
        if (currentFolderId === folder.id) {
          setCurrentFolderId(folder.parent_folder_id || null)
        }
        await loadData()
      } else {
        alert(response.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleFolderClick = (folderId: number) => {
    setCurrentFolderId(folderId)
  }

  const handleBack = () => {
    const currentFolder = folders.find(f => f.id === currentFolderId)
    setCurrentFolderId(currentFolder?.parent_folder_id || null)
  }

  // Get current folder
  const currentFolder = currentFolderId ? folders.find(f => f.id === currentFolderId) : null

  // Get breadcrumb path
  const getBreadcrumb = () => {
    const path: ProjectFolder[] = []
    let folder = currentFolder
    while (folder) {
      path.unshift(folder)
      folder = folder.parent_folder_id ? folders.find(f => f.id === folder.parent_folder_id) : undefined
    }
    return path
  }

  // Filter folders and projects for current view
  const currentFolders = folders.filter(f => Number(f.parent_folder_id) === currentFolderId || (currentFolderId === null && !f.parent_folder_id))
  const currentProjects = projects.filter(p => {
    const matchesFolder = Number(p.folder_id) === currentFolderId || (currentFolderId === null && !p.folder_id)
    const matchesSearch =
      p.nom_projet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFolder && matchesSearch
  })

  // Helper function to count projects in a folder (including subfolders)
  const countProjectsInFolder = (folderId: number): number => {
    const directProjects = projects.filter(p => Number(p.folder_id) === folderId).length
    const subFolders = folders.filter(f => Number(f.parent_folder_id) === folderId)
    const subFolderProjects = subFolders.reduce((sum, folder) => sum + countProjectsInFolder(folder.id), 0)
    return directProjects + subFolderProjects
  }

  const breadcrumb = getBreadcrumb()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900">
            Mes projets
          </h1>
          {stats && (
            <p className="text-sm text-gray-600 mt-1">
              {stats.projets_actifs} projet{stats.projets_actifs > 1 ? 's' : ''} actif{stats.projets_actifs > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importer CSV
          </Button>
          <Button variant="outline" onClick={handleCreateFolder}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Nouveau dossier
          </Button>
          <Button variant="accent" onClick={handleCreateProject}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un projet
          </Button>
        </div>
      </div>

      {/* Breadcrumb & Search */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          {currentFolderId && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="hover:text-primary hover:underline"
            >
              Racine
            </button>
            {breadcrumb.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <span>/</span>
                <button
                  onClick={() => setCurrentFolderId(folder.id)}
                  className={`hover:text-primary hover:underline ${
                    index === breadcrumb.length - 1 ? 'font-medium text-gray-900' : ''
                  }`}
                >
                  {folder.nom}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher un projet"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {currentFolders.length === 0 && currentProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'Aucun résultat trouvé' : 'Ce dossier est vide'}
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleCreateFolder}>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Créer un dossier
                  </Button>
                  <Button onClick={handleCreateProject}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un projet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              onDragOver={(e) => {
                e.preventDefault()
              }}
              onDrop={async (e) => {
                e.preventDefault()
                const draggedFolderId = e.dataTransfer.getData('folderId')
                const projectId = e.dataTransfer.getData('projectId')

                if (projectId) {
                  // Move project to current folder
                  try {
                    const response = await foldersApi.moveProject(Number(projectId), currentFolderId)
                    if (response.success) await loadData()
                  } catch (error) {
                    console.error('Error moving project:', error)
                  }
                } else if (draggedFolderId) {
                  // Move folder to current folder (or root if currentFolderId is null)
                  try {
                    const response = await foldersApi.update(Number(draggedFolderId), { parent_folder_id: currentFolderId })
                    if (response.success) await loadData()
                  } catch (error) {
                    console.error('Error moving folder:', error)
                  }
                }
              }}
            >
              {/* Folders */}
              {currentFolders.map(folder => (
                <Card
                  key={`folder-${folder.id}`}
                  className="cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => handleFolderClick(folder.id)}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation()
                    e.dataTransfer.setData('folderId', folder.id.toString())
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const draggedFolderId = e.dataTransfer.getData('folderId')
                    const projectId = e.dataTransfer.getData('projectId')

                    if (projectId) {
                      // Move project to folder
                      try {
                        const response = await foldersApi.moveProject(Number(projectId), folder.id)
                        if (response.success) await loadData()
                      } catch (error) {
                        console.error('Error moving project:', error)
                      }
                    } else if (draggedFolderId && draggedFolderId !== folder.id.toString()) {
                      // Move folder into folder
                      try {
                        const response = await foldersApi.update(Number(draggedFolderId), { parent_folder_id: folder.id })
                        if (response.success) await loadData()
                      } catch (error) {
                        console.error('Error moving folder:', error)
                      }
                    }
                  }}
                >
                  <CardContent className="p-6 relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            setItemToMove({ type: 'folder', id: folder.id })
                            setMoveModalOpen(true)
                          }}>
                            <Move className="w-4 h-4 mr-2" />
                            Déplacer vers...
                          </DropdownMenuItem>
                          {!folder.is_system && (
                            <>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditFolder(folder) }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Renommer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder) }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex justify-center mb-4">
                      <Folder className="w-20 h-20 text-primary" strokeWidth={1.5} />
                    </div>

                    <h3 className="font-semibold text-lg mb-1 text-center">
                      {folder.nom.replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è').replace(/Ã /g, 'à')}
                    </h3>
                    <p className="text-sm text-gray-500 text-center">
                      {countProjectsInFolder(folder.id)} projet(s)
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Projects */}
              {currentProjects.map(project => (
                <Card
                  key={`project-${project.id}`}
                  className="cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => handleProjectClick(project)}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation()
                    e.dataTransfer.setData('projectId', project.id.toString())
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <CardContent className="p-6 relative">
                    {!project.is_owner && (
                      <span className="absolute top-2 left-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Partagé
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          setItemToMove({ type: 'project', id: project.id })
                          setMoveModalOpen(true)
                        }}>
                          <Move className="w-4 h-4 mr-2" />
                          Déplacer vers...
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex justify-center mb-4">
                      <FileText className="w-20 h-20 text-primary" strokeWidth={1.5} />
                    </div>

                    <h3 className="font-semibold text-lg mb-1 truncate text-center">{project.nom_projet}</h3>
                    <p className="text-sm text-gray-600 mb-2 text-center">{project.client}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.statut === 'En cours' ? 'bg-green-100 text-green-800' :
                        project.statut === 'Terminé' ? 'bg-blue-100 text-blue-800' :
                        project.statut === 'Archivé' ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {project.statut}
                      </span>
                      <span className="text-xs text-gray-500">{project.typologie}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Stats Footer */}
      <div className="flex items-center justify-center space-x-8 py-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
          <p className="text-sm text-gray-600">Total de projets</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {projects.filter(p => p.statut === 'En cours').length}
          </p>
          <p className="text-sm text-gray-600">Projets actifs</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {folders.filter(f => !f.is_system).length}
          </p>
          <p className="text-sm text-gray-600">Dossiers personnalisés</p>
        </div>
      </div>

      {/* Modals */}
      <ProjectModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        onSuccess={loadData}
        project={selectedProject}
        defaultFolderId={currentFolderId}
      />
      <ImportProjectsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={loadData}
      />
      <FolderModal
        open={folderModalOpen}
        onOpenChange={setFolderModalOpen}
        folder={editingFolder}
        parentFolder={parentFolder}
        onSuccess={loadData}
      />
      {itemToMove && (
        <MoveFolderModal
          open={moveModalOpen}
          onOpenChange={setMoveModalOpen}
          folders={folders}
          itemType={itemToMove.type}
          itemId={itemToMove.id}
          currentFolderId={
            itemToMove.type === 'project'
              ? projects.find(p => p.id === itemToMove.id)?.folder_id || null
              : folders.find(f => f.id === itemToMove.id)?.parent_folder_id || null
          }
          onMove={async (destinationFolderId) => {
            if (itemToMove.type === 'project') {
              const response = await foldersApi.moveProject(itemToMove.id, destinationFolderId)
              if (response.success) {
                await loadData()
              }
            } else {
              const response = await foldersApi.update(itemToMove.id, { parent_folder_id: destinationFolderId })
              if (response.success) {
                await loadData()
              }
            }
          }}
        />
      )}
    </div>
  )
}
