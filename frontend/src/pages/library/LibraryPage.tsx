import { useEffect, useState, useMemo } from 'react'
import { articlesApi, librariesApi, projectsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Upload, Settings, Edit, Trash2, MoreVertical, Filter, CheckSquare, X, FolderInput, ChevronDown, Download, Folder, ArrowLeft, FolderKanban, Users, UserCheck, Link2, BookOpen } from 'lucide-react'
import type { Article, Library, Project } from '@/types'
import { LibraryModal } from '@/components/modals/LibraryModal'
import { ImportArticlesModal } from '@/components/modals/ImportArticlesModal'
import { ArticleModal } from '@/components/modals/ArticleModal'
import { AssignProjectsModal } from '@/components/modals/AssignProjectsModal'
import { ShareModal } from '@/components/modals/ShareModal'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Standard construction lots (16 lots)
const LOTS = [
  '1-TERRASSEMENTS',
  '2-GROS ŒUVRE',
  '3-CHARPENTE',
  '4-COUVERTURE',
  '5-PLOMBERIE',
  '6-ÉLECTRICITÉ',
  '7-CHAUFFAGE',
  '8-MENUISERIES EXTÉRIEURES',
  '9-MENUISERIES INTÉRIEURES',
  '10-CLOISONS',
  '11-PLÂTRERIE',
  '12-CARRELAGE',
  '13-PEINTURE',
  '14-REVÊTEMENTS DE SOL',
  '15-PLAFONDS',
  '16-VRD'
]

const SOUS_CATEGORIES = [
  'Carrelage',
  'Peinture',
  'Fondation',
  'Porte',
  'Fenêtre',
  'Isolation',
  'Sanitaire',
  'Radiateur',
  'Autre'
]

const UNITES = ['M2', 'L', 'M3', 'U', 'ML', 'KG']

export function LibraryPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [libraries, setLibraries] = useState<Library[]>([])
  const [selectedLibrary, setSelectedLibrary] = useState<number | null>(null)
  const [libraryProjects, setLibraryProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [libraryModalOpen, setLibraryModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [articleModalOpen, setArticleModalOpen] = useState(false)
  const [assignProjectsModalOpen, setAssignProjectsModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [editingLibrary, setEditingLibrary] = useState<Library | null>(null)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [manageMode, setManageMode] = useState(false)
  const [articleMenuOpen, setArticleMenuOpen] = useState<number | null>(null)

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedArticles, setSelectedArticles] = useState<number[]>([])

  // Filters
  const [lotFilter, setLotFilter] = useState('all')
  const [sousCategorieFilter, setSousCategorieFilter] = useState('all')
  const [uniteFilter, setUniteFilter] = useState('all')
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'shared' | 'from_project'>('all')

  useEffect(() => {
    loadLibraries()
  }, [])

  useEffect(() => {
    if (selectedLibrary) {
      loadArticles(selectedLibrary)
      loadLibraryProjects(selectedLibrary)
    } else {
      setArticles([])
      setLibraryProjects([])
      setLoading(false)
    }
  }, [selectedLibrary])

  const loadLibraries = async () => {
    try {
      const response = await librariesApi.list()
      if (response.success && response.data) {
        setLibraries(response.data)
        // Ne plus sélectionner automatiquement la première bibliothèque
      }
    } catch (error) {
      console.error('Error loading libraries:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadArticles = async (libraryId: number) => {
    setLoading(true)
    try {
      const response = await articlesApi.list(libraryId)
      if (response.success && response.data) {
        setArticles(response.data)
      }
    } catch (error) {
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLibraryProjects = async (libraryId: number) => {
    try {
      const response = await librariesApi.getProjects(libraryId)
      if (response.success && response.data) {
        setLibraryProjects(response.data)
      }
    } catch (error) {
      console.error('Error loading library projects:', error)
    }
  }


  const handleCreateLibrary = () => {
    setEditingLibrary(null)
    setLibraryModalOpen(true)
    setManageMode(false)
  }

  const handleEditLibrary = (library: Library) => {
    setEditingLibrary(library)
    setLibraryModalOpen(true)
  }

  const handleDeleteLibrary = async (libraryId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bibliothèque et tous ses articles ?')) return

    try {
      const response = await librariesApi.delete(libraryId)
      if (response.success) {
        await loadLibraries()
        if (selectedLibrary === libraryId) {
          setSelectedLibrary(null)
        }
      } else {
        alert(response.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting library:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleOpenLibrary = (libraryId: number) => {
    setSelectedLibrary(libraryId)
    setManageMode(false)
  }

  const handleCreateArticle = () => {
    setEditingArticle(null)
    setArticleModalOpen(true)
  }

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article)
    setArticleModalOpen(true)
    setArticleMenuOpen(null)
  }

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return

    try {
      const response = await articlesApi.delete(articleId)
      if (response.success && selectedLibrary) {
        loadArticles(selectedLibrary)
      } else {
        alert(response.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Selection mode functions
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode)
    setSelectedArticles([])
  }

  const toggleArticleSelection = (articleId: number) => {
    setSelectedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    )
  }

  const selectAll = () => {
    setSelectedArticles(filteredArticles.map(a => a.id))
  }

  const deselectAll = () => {
    setSelectedArticles([])
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedArticles.length} article(s) ?`)) return

    try {
      for (const articleId of selectedArticles) {
        await articlesApi.delete(articleId)
      }
      if (selectedLibrary) {
        await loadArticles(selectedLibrary)
      }
      setSelectedArticles([])
      setSelectionMode(false)
    } catch (error) {
      console.error('Error deleting articles:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleMoveToLibrary = async (targetLibraryIdStr: string) => {
    const targetLibraryId = parseInt(targetLibraryIdStr)
    if (!confirm(`Déplacer ${selectedArticles.length} article(s) vers une autre bibliothèque ?`)) return

    try {
      const response = await articlesApi.moveToLibrary(selectedArticles, targetLibraryId)
      if (response.success && selectedLibrary) {
        await loadArticles(selectedLibrary)
        setSelectedArticles([])
        alert(response.message || 'Articles déplacés avec succès')
      } else {
        alert(response.error || 'Erreur lors du déplacement')
      }
    } catch (error) {
      console.error('Error moving articles:', error)
      alert('Erreur lors du déplacement')
    }
  }

  // Filtered articles with useMemo for performance
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Search filter
      const matchesSearch =
        article.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.lot.toLowerCase().includes(searchTerm.toLowerCase())

      // Lot filter
      const matchesLot = lotFilter === 'all' || article.lot === lotFilter

      // Sous-catégorie filter
      const matchesSousCategorie = sousCategorieFilter === 'all' || article.sous_categorie === sousCategorieFilter

      // Unité filter
      const matchesUnite = uniteFilter === 'all' || article.unite === uniteFilter

      return matchesSearch && matchesLot && matchesSousCategorie && matchesUnite
    })
  }, [articles, searchTerm, lotFilter, sousCategorieFilter, uniteFilter])

  const resetFilters = () => {
    setLotFilter('all')
    setSousCategorieFilter('all')
    setUniteFilter('all')
    setSearchTerm('')
  }

  const hasActiveFilters = lotFilter !== 'all' || sousCategorieFilter !== 'all' || uniteFilter !== 'all' || searchTerm !== ''

  const currentLibrary = libraries.find(lib => lib.id === selectedLibrary)

  // Filter libraries by ownership
  const filteredLibraries = useMemo(() => {
    return libraries.filter(library => {
      if (ownershipFilter === 'all') return true
      // Convertir en booléen car le backend peut retourner 0/1
      const isOwner = Boolean(library.is_owner)
      const fromSharedProject = Boolean(library.from_shared_project)
      const hasDirectShare = Boolean(library.shared_role)

      if (ownershipFilter === 'owned') return isOwner && !fromSharedProject
      if (ownershipFilter === 'shared') return !isOwner && (hasDirectShare || fromSharedProject)
      if (ownershipFilter === 'from_project') return fromSharedProject
      return true
    })
  }, [libraries, ownershipFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedLibrary && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedLibrary(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          <h1 className="text-3xl font-bold font-heading text-gray-900">
            {selectedLibrary ? currentLibrary?.nom : 'Bibliothèque'}
          </h1>
        </div>
        <div className="flex space-x-3">
          {!selectedLibrary && (
            <>
              <Button variant="outline" onClick={handleCreateLibrary}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle bibliothèque
              </Button>
              <Button variant="accent" onClick={() => setImportModalOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importer bibliothèque CSV
              </Button>
            </>
          )}
          {selectedLibrary && (
            <>
              <Button variant="outline" onClick={() => setShareModalOpen(true)}>
                <Users className="w-4 h-4 mr-2" />
                Partager
              </Button>
              <Button variant="accent" onClick={handleCreateArticle}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un article
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Vue des bibliothèques (grille de cartes) */}
      {!selectedLibrary && (
        <>
          {/* Filtre de propriété */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrer:</span>
            <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Propriété" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les bibliothèques</SelectItem>
                <SelectItem value="owned">Mes bibliothèques</SelectItem>
                <SelectItem value="shared">Partagées avec moi</SelectItem>
                <SelectItem value="from_project">De projets partagés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredLibraries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-600 mb-4">Aucune bibliothèque trouvée</p>
                <div className="flex gap-2">
                  <Button variant="accent" onClick={handleCreateLibrary}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer ma première bibliothèque
                  </Button>
                  <Button variant="outline" onClick={() => setImportModalOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importer une bibliothèque
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredLibraries.map((library) => (
                <Card key={library.id} className="hover:shadow-xl transition-all group relative flex flex-col h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center h-full">
                    {/* Menu 3 points */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditLibrary(library)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteLibrary(library.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Icône bibliothèque */}
                    <div className="mb-4 relative flex justify-center">
                      <BookOpen className="w-20 h-20 text-primary" strokeWidth={1.5} />
                      {Boolean(library.from_shared_project) ? (
                        library.project_shared_role === 'viewer' ? (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md" title="Bibliothèque d'un projet partagé (lecture seule)">
                            <Link2 className="w-5 h-5 text-purple-600" />
                          </div>
                        ) : (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md" title="Bibliothèque d'un projet partagé (modification)">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                          </div>
                        )
                      ) : !Boolean(library.is_owner) && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md" title="Bibliothèque partagée">
                          <UserCheck className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                    </div>

                    {/* Nom de la bibliothèque */}
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {library.nom}
                    </h3>

                    {/* Description avec hauteur fixe */}
                    <div className="h-12 mb-2 flex items-center justify-center">
                      {library.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {library.description}
                        </p>
                      )}
                    </div>

                    {/* Nombre d'articles */}
                    <p className="text-xs text-gray-500 mb-4">
                      En cours
                    </p>

                    {/* Spacer pour pousser les boutons vers le bas */}
                    <div className="flex-grow"></div>

                    {/* Boutons d'action */}
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenLibrary(library.id)}
                      >
                        Ouvrir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          window.open(`http://localhost/metr2/backend/api/libraries/export.php?library_id=${library.id}`, '_blank')
                        }}
                      >
                        Exporter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Vue détaillée d'une bibliothèque (articles) */}
      {selectedLibrary && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {articles.length} article(s)
                  </span>
                </div>
                {articles.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(`http://localhost/metr2/backend/api/libraries/export.php?library_id=${selectedLibrary}`, '_blank')
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter en CSV
                  </Button>
                )}
              </div>

              {/* Projects using this library */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FolderKanban className="w-5 h-5" />
                      Projets utilisant cette bibliothèque ({libraryProjects.length})
                    </CardTitle>
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => setAssignProjectsModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Gérer les projets
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {libraryProjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>Aucun projet n'utilise cette bibliothèque</p>
                      <p className="text-sm mt-1">
                        Assignez cette bibliothèque à des projets pour faciliter le chiffrage
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {libraryProjects.map((project: any) => (
                        <div
                          key={project.id}
                          className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer relative group"
                          onClick={() => window.location.href = `/projects/${project.id}`}
                        >
                          {/* Delete button to unassign library from project */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!confirm(`Êtes-vous sûr de vouloir délier la bibliothèque de "${project.nom_projet}" ?`)) return
                              try {
                                const response = await projectsApi.unassignLibrary(project.id, selectedLibrary)
                                console.log('Unassign response:', response)
                                if (response.success) {
                                  await loadLibraryProjects(selectedLibrary)
                                } else {
                                  console.error('API Error:', response)
                                  alert(response.error || 'Erreur lors de la suppression')
                                }
                              } catch (error: any) {
                                console.error('Error unassigning library:', error)
                                alert('Erreur: ' + (error?.message || JSON.stringify(error)))
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Délier la bibliothèque de ce projet"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>

                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                              <FolderKanban className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate text-sm">
                                {project.nom_projet}
                              </h4>
                              <p className="text-xs text-gray-600 truncate">{project.client}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                                  project.statut === 'En cours' ? 'bg-green-100 text-green-800' :
                                  project.statut === 'Brouillon' ? 'bg-orange-100 text-orange-800' :
                                  project.statut === 'Terminé' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {project.statut}
                                </span>
                                {project.phase && (
                                  <span className="text-xs text-blue-600">{project.phase}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Search and Filters */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Rechercher un article"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filtres:</span>
                  </div>

                  <Select value={lotFilter} onValueChange={setLotFilter}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Tous les lots" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les lots</SelectItem>
                      {LOTS.map(lot => (
                        <SelectItem key={lot} value={lot}>{lot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sousCategorieFilter} onValueChange={setSousCategorieFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sous-catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {SOUS_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={uniteFilter} onValueChange={setUniteFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Unité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {UNITES.map(unite => (
                        <SelectItem key={unite} value={unite}>{unite}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectionMode}
                    className={`ml-auto ${selectionMode ? 'bg-white !text-gray-700 hover:!bg-gray-50' : ''}`}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {selectionMode ? "Quitter le mode sélection" : "Sélectionner"}
                  </Button>

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
                  {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} trouvé{filteredArticles.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Articles Table */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredArticles.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-600 mb-4">
                      {hasActiveFilters
                        ? 'Aucun article ne correspond aux filtres'
                        : searchTerm
                        ? 'Aucun article trouvé pour cette recherche'
                        : 'Aucun article dans cette bibliothèque'}
                    </p>
                    {!searchTerm && !hasActiveFilters && selectedLibrary && (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCreateArticle}>
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter un article
                        </Button>
                        <Button variant="accent" onClick={() => setImportModalOpen(true)}>
                          <Upload className="w-4 h-4 mr-2" />
                          Importer des articles
                        </Button>
                      </div>
                    )}
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={resetFilters}>
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Selection mode toolbar */}
                  {selectionMode && (
                    <div className="mb-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                      <div className="px-6 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <CheckSquare className="w-4 h-4 mr-2" />
                                {selectedArticles.length === 0
                                  ? 'Sélectionner'
                                  : selectedArticles.length === filteredArticles.length
                                    ? `Tous (${selectedArticles.length})`
                                    : `${selectedArticles.length} sélectionné${selectedArticles.length > 1 ? 's' : ''}`
                                }
                                <ChevronDown className="w-4 h-4 ml-2" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={selectAll}>
                                Tous ({filteredArticles.length})
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={deselectAll}>
                                Aucun
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {selectedArticles.length > 0 && (
                            <>
                              {libraries.length > 1 && (
                                <Select onValueChange={handleMoveToLibrary}>
                                  <SelectTrigger className="w-[200px] h-9">
                                    <SelectValue placeholder="Déplacer vers" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {libraries
                                      .filter(lib => lib.id !== selectedLibrary)
                                      .map(lib => (
                                        <SelectItem key={lib.id} value={lib.id.toString()}>
                                          {lib.nom}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </Button>
                            </>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleSelectionMode}
                          className="!text-gray-700 hover:!text-gray-900 hover:!bg-gray-100"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Fermer
                        </Button>
                      </div>
                    </div>
                  )}

                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            {selectionMode && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <span className="sr-only">Sélection</span>
                              </th>
                            )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Désignation
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lot
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sous-catégorie
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unité
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prix unitaire
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dernière mise à jour
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredArticles.map((article) => (
                          <tr key={article.id} className={`hover:bg-gray-50 ${selectedArticles.includes(article.id) ? 'bg-blue-50' : ''}`}>
                            {selectionMode && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedArticles.includes(article.id)}
                                  onChange={() => toggleArticleSelection(article.id)}
                                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                              </td>
                            )}
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">
                                  {article.designation}
                                </span>
                                {article.statut === 'Nouveau' && (
                                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Nouveau
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {article.lot}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {article.sous_categorie || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {article.unite}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {typeof article.prix_unitaire === 'number'
                                ? article.prix_unitaire.toFixed(2)
                                : parseFloat(article.prix_unitaire).toFixed(2)} €
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(article.updated_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="relative">
                                <button
                                  className="p-2 hover:bg-gray-100 rounded-lg"
                                  onClick={() => setArticleMenuOpen(articleMenuOpen === article.id ? null : article.id)}
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-600" />
                                </button>
                                {articleMenuOpen === article.id && (
                                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                      onClick={() => handleEditArticle(article)}
                                    >
                                      <Edit className="w-4 h-4" />
                                      Modifier
                                    </button>
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-destructive"
                                      onClick={() => handleDeleteArticle(article.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Supprimer
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </>
      )}

      {/* Modals */}
      <LibraryModal
        open={libraryModalOpen}
        onOpenChange={setLibraryModalOpen}
        onSuccess={loadLibraries}
        library={editingLibrary}
      />
      {/* Modals */}
      <ImportArticlesModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={loadLibraries}
      />
      {selectedLibrary && (
        <ArticleModal
          open={articleModalOpen}
          onOpenChange={setArticleModalOpen}
          onSuccess={() => selectedLibrary && loadArticles(selectedLibrary)}
          article={editingArticle}
          libraryId={selectedLibrary}
        />
      )}
      {selectedLibrary && (
        <AssignProjectsModal
          open={assignProjectsModalOpen}
          onOpenChange={setAssignProjectsModalOpen}
          libraryId={selectedLibrary}
          libraryName={libraries.find(l => l.id === selectedLibrary)?.nom || ''}
          onSuccess={() => selectedLibrary && loadLibraryProjects(selectedLibrary)}
        />
      )}
      {selectedLibrary && (
        <ShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          type="library"
          itemId={selectedLibrary}
          itemName={libraries.find(l => l.id === selectedLibrary)?.nom || ''}
          onSuccess={() => selectedLibrary && loadLibraries()}
        />
      )}
    </div>
  )
}
