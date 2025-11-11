import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { projectsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Search, MoreVertical, Upload, Edit, Trash2, Filter, SortAsc, FolderKanban } from 'lucide-react'
import type { Project } from '@/types'
import { ProjectModal } from '@/components/modals/ProjectModal'
import { ImportProjectsModal } from '@/components/modals/ImportProjectsModal'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [typologyFilter, setTypologyFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [sortBy, setSortBy] = useState('last_modified')

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await projectsApi.list()
      if (response.success && response.data) {
        setProjects(response.data)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique clients and years for filters
  const uniqueClients = useMemo(() => {
    const clients = [...new Set(projects.map(p => p.client))].sort()
    return clients
  }, [projects])

  const uniqueYears = useMemo(() => {
    const years = [...new Set(projects.map(p => {
      const date = p.created_at ? new Date(p.created_at) : null
      return date ? date.getFullYear().toString() : null
    }).filter(Boolean) as string[])].sort().reverse()
    return years
  }, [projects])

  // Filtered and sorted projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Search filter
      const matchesSearch =
        project.nom_projet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'all' || project.statut === statusFilter

      // Phase filter
      const matchesPhase = phaseFilter === 'all' || project.phase === phaseFilter

      // Typology filter
      const matchesTypology = typologyFilter === 'all' || project.typologie === typologyFilter

      // Client filter
      const matchesClient = clientFilter === 'all' || project.client === clientFilter

      // Year filter
      const matchesYear = yearFilter === 'all' || (
        project.created_at &&
        new Date(project.created_at).getFullYear().toString() === yearFilter
      )

      // Archived filter
      const matchesArchived = showArchived || project.statut !== 'Archivé'

      return matchesSearch && matchesStatus && matchesPhase && matchesTypology && matchesClient && matchesYear && matchesArchived
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'last_modified':
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime()
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime()
          return dateB - dateA

        case 'name_az':
          return a.nom_projet.localeCompare(b.nom_projet)

        case 'created_date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

        default:
          return 0
      }
    })

    return filtered
  }, [projects, searchTerm, statusFilter, typologyFilter, clientFilter, yearFilter, showArchived, sortBy])

  const navigate = useNavigate()

  const handleCreateProject = () => {
    navigate({ to: "/projects/create" })
  }

  const handleEditProject = (project: Project) => {
    navigate({ to: `/projects/${project.id}/edit` })
    setMenuOpen(null)
  }

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

    try {
      const response = await projectsApi.delete(projectId)
      if (response.success) {
        loadProjects()
      } else {
        alert(response.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleViewChiffrage = (projectId: number) => {
    // Naviguer vers la page de prévisualisation du chiffrage
    navigate({ to: `/projects/${projectId}/chiffrage` })
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

  const resetFilters = () => {
    setStatusFilter('all')
    setTypologyFilter('all')
    setClientFilter('all')
    setYearFilter('all')
    setShowArchived(false)
    setSortBy('last_modified')
    setSearchTerm('')
  }

  const hasActiveFilters = statusFilter !== 'all' || typologyFilter !== 'all' ||
    clientFilter !== 'all' || yearFilter !== 'all' || showArchived || searchTerm !== ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading text-gray-900">
          Mes projets
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importer CSV
          </Button>
          <Button variant="accent" onClick={handleCreateProject}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un projet
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher un projet"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_modified">Dernière modification</SelectItem>
              <SelectItem value="name_az">Nom A - Z</SelectItem>
              <SelectItem value="created_date">Date de création</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtres:</span>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Brouillon">Brouillon</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Terminé">Terminé</SelectItem>
              <SelectItem value="Archivé">Archivé</SelectItem>
            </SelectContent>
          </Select>

          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes les phases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les phases</SelectItem>
              <SelectItem value="Esquisse">Esquisse</SelectItem>
              <SelectItem value="Avant-projet">Avant-projet</SelectItem>
              <SelectItem value="Avant-projet définitif">Avant-projet définitif</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typologyFilter} onValueChange={setTypologyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Typologie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="Maison individuelle">Maison</SelectItem>
              <SelectItem value="Immeuble résidentiel">Collectif</SelectItem>
              <SelectItem value="Bureau">Tertiaire</SelectItem>
              <SelectItem value="Commerce">Commerce</SelectItem>
              <SelectItem value="Industriel">Industriel</SelectItem>
              <SelectItem value="Équipement public">Équipement public</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>

          {uniqueClients.length > 0 && (
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {uniqueClients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {uniqueYears.length > 0 && (
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-2 ml-2">
            <Switch
              id="showArchived"
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(checked)}
            />
            <Label
              htmlFor="showArchived"
              className="text-sm font-normal cursor-pointer"
            >
              Afficher aussi les projets archivés
            </Label>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs"
            >
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Filter summary */}
        <div className="text-sm text-gray-600">
          {filteredAndSortedProjects.length} projet{filteredAndSortedProjects.length !== 1 ? 's' : ''} trouvé{filteredAndSortedProjects.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredAndSortedProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 mb-4">
              {hasActiveFilters ? 'Aucun projet ne correspond aux filtres' : 'Aucun projet trouvé'}
            </p>
            {!hasActiveFilters && (
              <Button variant="accent" onClick={handleCreateProject}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un projet
              </Button>
            )}
            {hasActiveFilters && (
              <Button variant="outline" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredAndSortedProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-xl transition-all group relative flex flex-col h-full">
              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                {/* Menu 3 points */}
                <div className="absolute top-2 right-2">
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                  {menuOpen === project.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => handleEditProject(project)}
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-destructive"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>

                {/* Icône dossier */}
                <div className="mb-4">
                  <FolderKanban className="w-20 h-20 text-primary" strokeWidth={1.5} />
                </div>

                {/* Nom du projet */}
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {project.nom_projet}
                </h3>

                {/* Client */}
                <p className="text-sm text-gray-600 mb-2">{project.client}</p>

                {/* Typologie et Phase avec hauteur fixe */}
                <div className="h-10 mb-2 flex flex-col items-center justify-center gap-1">
                  {project.typologie && (
                    <span className="text-xs text-gray-500">{project.typologie}</span>
                  )}
                  {project.phase && (
                    <span className="text-xs text-blue-600 font-medium">{project.phase}</span>
                  )}
                </div>

                {/* Statut */}
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.statut)} mb-4`}>
                  {project.statut}
                </span>

                {/* Spacer pour pousser les boutons vers le bas */}
                <div className="flex-grow"></div>

                {/* Boutons d'action */}
                <div className="flex gap-2 w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate({ to: `/projects/${project.id}` })}
                  >
                    Ouvrir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewChiffrage(project.id)}
                  >
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
            {projects.filter(p => p.statut === 'Archivé').length}
          </p>
          <p className="text-sm text-gray-600">Projets archivés</p>
        </div>
      </div>

      {/* Modals */}
      <ProjectModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        onSuccess={loadProjects}
        project={selectedProject}
      />
      <ImportProjectsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={loadProjects}
      />
    </div>
  )
}
