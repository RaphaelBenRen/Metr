import { useEffect, useState, useMemo } from 'react'
import { articlesApi, librariesApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Upload, Settings, Star, Edit, Trash2, MoreVertical, Filter, CheckSquare, X, FolderInput, ChevronDown } from 'lucide-react'
import type { Article, Library } from '@/types'
import { LibraryModal } from '@/components/modals/LibraryModal'
import { ImportArticlesModal } from '@/components/modals/ImportArticlesModal'
import { ArticleModal } from '@/components/modals/ArticleModal'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [libraryModalOpen, setLibraryModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [articleModalOpen, setArticleModalOpen] = useState(false)
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

  useEffect(() => {
    loadLibraries()
  }, [])

  useEffect(() => {
    if (selectedLibrary) {
      loadArticles(selectedLibrary)
    }
  }, [selectedLibrary])

  const loadLibraries = async () => {
    try {
      const response = await librariesApi.list()
      if (response.success && response.data) {
        setLibraries(response.data)
        if (response.data.length > 0 && !selectedLibrary) {
          setSelectedLibrary(response.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading libraries:', error)
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

  const handleToggleFavorite = async (articleId: number) => {
    try {
      const response = await articlesApi.toggleFavorite(articleId)
      if (response.success && selectedLibrary) {
        loadArticles(selectedLibrary)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
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
          setSelectedLibrary(libraries.length > 1 ? libraries[0].id : null)
        }
      } else {
        alert(response.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting library:', error)
      alert('Erreur lors de la suppression')
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading text-gray-900">
          Ma bibliothèque
        </h1>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setManageMode(!manageMode)}>
            <Settings className="w-4 h-4 mr-2" />
            {manageMode ? 'Mode normal' : 'Gérer les bibliothèques'}
          </Button>
          <Button variant="outline" onClick={handleCreateLibrary}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle bibliothèque
          </Button>
          {selectedLibrary && !manageMode && (
            <>
              <Button variant="outline" onClick={handleCreateArticle}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un article
              </Button>
              <Button variant="accent" onClick={() => setImportModalOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importer CSV
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Library Selector */}
      {libraries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 mb-4">Aucune bibliothèque trouvée</p>
            <Button variant="accent" onClick={handleCreateLibrary}>
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première bibliothèque
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {manageMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {libraries.map((library) => (
                <Card key={library.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{library.nom}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {library.description || 'Pas de description'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Créée le {new Date(library.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          onClick={() => handleEditLibrary(library)}
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-red-100 rounded-lg"
                          onClick={() => handleDeleteLibrary(library.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-4">
                <select
                  className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2"
                  value={selectedLibrary || ''}
                  onChange={(e) => setSelectedLibrary(Number(e.target.value))}
                >
                  {libraries.map((lib) => (
                    <option key={lib.id} value={lib.id}>
                      {lib.nom}
                    </option>
                  ))}
                </select>
                {currentLibrary && (
                  <span className="text-sm text-gray-600">
                    {articles.length} article(s)
                  </span>
                )}
              </div>

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
                              Favoris
                            </th>
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button onClick={() => handleToggleFavorite(article.id)}>
                                <Star
                                  className={`w-5 h-5 ${article.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              </button>
                            </td>
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
        </>
      )}

      {/* Modals */}
      <LibraryModal
        open={libraryModalOpen}
        onOpenChange={setLibraryModalOpen}
        onSuccess={loadLibraries}
        library={editingLibrary}
      />
      {selectedLibrary && (
        <>
          <ImportArticlesModal
            open={importModalOpen}
            onOpenChange={setImportModalOpen}
            onSuccess={() => selectedLibrary && loadArticles(selectedLibrary)}
            libraryId={selectedLibrary}
          />
          <ArticleModal
            open={articleModalOpen}
            onOpenChange={setArticleModalOpen}
            onSuccess={() => selectedLibrary && loadArticles(selectedLibrary)}
            article={editingArticle}
            libraryId={selectedLibrary}
          />
        </>
      )}
    </div>
  )
}
