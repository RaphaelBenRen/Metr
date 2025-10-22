import { useEffect, useState, useMemo } from 'react'
import { adminApi, statisticsApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, FolderOpen, BookOpen, TrendingUp, Edit2, Trash2, MoreVertical, Search } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminUserModal } from '@/components/modals/AdminUserModal'
import { AdminProjectModal } from '@/components/modals/AdminProjectModal'
import { AdminLibraryModal } from '@/components/modals/AdminLibraryModal'
import { AdminArticleModal } from '@/components/modals/AdminArticleModal'

type Tab = 'users' | 'projects' | 'libraries' | 'articles'

export function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [libraries, setLibraries] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Search states
  const [searchUser, setSearchUser] = useState('')
  const [searchProject, setSearchProject] = useState('')
  const [searchLibrary, setSearchLibrary] = useState('')
  const [searchArticle, setSearchArticle] = useState('')

  // Modal states
  const [userModal, setUserModal] = useState<{ open: boolean; user: any | null }>({ open: false, user: null })
  const [projectModal, setProjectModal] = useState<{ open: boolean; project: any | null }>({ open: false, project: null })
  const [libraryModal, setLibraryModal] = useState<{ open: boolean; library: any | null }>({ open: false, library: null })
  const [articleModal, setArticleModal] = useState<{ open: boolean; article: any | null }>({ open: false, article: null })

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      navigate({ to: '/dashboard' })
      return
    }

    loadAdminData()
  }, [user, navigate])

  const loadAdminData = async () => {
    try {
      const [statsRes, usersRes, projectsRes, librariesRes, articlesRes] = await Promise.all([
        statisticsApi.getAdminStats(),
        adminApi.getUsers(),
        adminApi.getAllProjects(),
        adminApi.getAllLibraries(),
        adminApi.getAllArticles(),
      ])

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data)
      }

      if (projectsRes.success && projectsRes.data) {
        setProjects(projectsRes.data)
      }

      if (librariesRes.success && librariesRes.data) {
        setLibraries(librariesRes.data)
      }

      if (articlesRes.success && articlesRes.data) {
        setArticles(articlesRes.data)
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtered data with search
  const filteredUsers = useMemo(() => {
    if (!searchUser) return users
    const search = searchUser.toLowerCase()
    return users.filter(u =>
      u.nom?.toLowerCase().includes(search) ||
      u.prenom?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.entreprise?.toLowerCase().includes(search)
    )
  }, [users, searchUser])

  const filteredProjects = useMemo(() => {
    if (!searchProject) return projects
    const search = searchProject.toLowerCase()
    return projects.filter(p =>
      p.nom_projet?.toLowerCase().includes(search) ||
      p.client?.toLowerCase().includes(search) ||
      p.typologie?.toLowerCase().includes(search) ||
      p.user_nom?.toLowerCase().includes(search) ||
      p.user_prenom?.toLowerCase().includes(search)
    )
  }, [projects, searchProject])

  const filteredLibraries = useMemo(() => {
    if (!searchLibrary) return libraries
    const search = searchLibrary.toLowerCase()
    return libraries.filter(l =>
      l.nom?.toLowerCase().includes(search) ||
      l.description?.toLowerCase().includes(search) ||
      l.user_nom?.toLowerCase().includes(search) ||
      l.user_prenom?.toLowerCase().includes(search)
    )
  }, [libraries, searchLibrary])

  const filteredArticles = useMemo(() => {
    if (!searchArticle) return articles
    const search = searchArticle.toLowerCase()
    return articles.filter(a =>
      a.designation?.toLowerCase().includes(search) ||
      a.lot?.toLowerCase().includes(search) ||
      a.library_nom?.toLowerCase().includes(search) ||
      a.user_nom?.toLowerCase().includes(search) ||
      a.user_prenom?.toLowerCase().includes(search)
    )
  }, [articles, searchArticle])

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    const response = await adminApi.deleteUser(id)
    if (response.success) {
      setUsers(users.filter(u => u.id !== id))
    } else {
      alert(response.error || 'Erreur lors de la suppression')
    }
  }

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

    const response = await adminApi.deleteProject(id)
    if (response.success) {
      setProjects(projects.filter(p => p.id !== id))
    } else {
      alert(response.error || 'Erreur lors de la suppression')
    }
  }

  const handleDeleteLibrary = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bibliothèque et tous ses articles ?')) return

    const response = await adminApi.deleteLibrary(id)
    if (response.success) {
      setLibraries(libraries.filter(l => l.id !== id))
      loadAdminData() // Reload to update article count
    } else {
      alert(response.error || 'Erreur lors de la suppression')
    }
  }

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return

    const response = await adminApi.deleteArticle(id)
    if (response.success) {
      setArticles(articles.filter(a => a.id !== id))
    } else {
      alert(response.error || 'Erreur lors de la suppression')
    }
  }

  const handleChangeUserRole = async (userId: number, newRole: string) => {
    const response = await adminApi.updateUser(userId, { role: newRole })
    if (response.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } else {
      alert(response.error || 'Erreur lors de la mise à jour')
    }
  }

  const handleChangeProjectStatus = async (projectId: number, newStatus: string) => {
    const response = await adminApi.updateProject(projectId, { statut: newStatus })
    if (response.success) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, statut: newStatus } : p))
    } else {
      alert(response.error || 'Erreur lors de la mise à jour')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading text-gray-900">
        Administration
      </h1>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.total_users || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total projets</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.total_projects || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total articles</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.total_articles || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bibliothèques</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.total_libraries || libraries.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-5 h-5 inline-block mr-2" />
            Utilisateurs ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'projects'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderOpen className="w-5 h-5 inline-block mr-2" />
            Projets ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('libraries')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'libraries'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="w-5 h-5 inline-block mr-2" />
            Bibliothèques ({libraries.length})
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'articles'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="w-5 h-5 inline-block mr-2" />
            Articles ({articles.length})
          </button>
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscription</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {u.prenom} {u.nom}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.entreprise || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.telephone || '-'}</td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {u.role}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleChangeUserRole(u.id, 'user')}>
                              Utilisateur
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeUserRole(u.id, 'admin')}>
                              Administrateur
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setUserModal({ open: true, user: u })}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(u.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestion des projets</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un projet..."
                  value={searchProject}
                  onChange={(e) => setSearchProject(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typologie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propriétaire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Création</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {p.nom_projet}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.client}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.typologie}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {p.user_prenom} {p.user_nom}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${
                              p.statut === 'Terminé' ? 'bg-green-100 text-green-800' :
                              p.statut === 'En cours' ? 'bg-blue-100 text-blue-800' :
                              p.statut === 'Archivé' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {p.statut}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleChangeProjectStatus(p.id, 'Brouillon')}>
                              Brouillon
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeProjectStatus(p.id, 'En cours')}>
                              En cours
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeProjectStatus(p.id, 'Terminé')}>
                              Terminé
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeProjectStatus(p.id, 'Archivé')}>
                              Archivé
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(p.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setProjectModal({ open: true, project: p })}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteProject(p.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Libraries Tab */}
      {activeTab === 'libraries' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestion des bibliothèques</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une bibliothèque..."
                  value={searchLibrary}
                  onChange={(e) => setSearchLibrary(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propriétaire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Articles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Création</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLibraries.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {l.nom}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{l.description || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {l.user_prenom} {l.user_nom}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{l.article_count}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          l.is_global ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {l.is_global ? 'Globale' : 'Privée'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(l.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLibraryModal({ open: true, library: l })}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteLibrary(l.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles Tab */}
      {activeTab === 'articles' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestion des articles</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchArticle}
                  onChange={(e) => setSearchArticle(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Désignation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bibliothèque</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propriétaire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArticles.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {a.designation}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.lot}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.library_nom}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {a.user_prenom} {a.user_nom}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {typeof a.prix_unitaire === 'number' ? a.prix_unitaire.toFixed(2) : parseFloat(a.prix_unitaire).toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.unite}</td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setArticleModal({ open: true, article: a })}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteArticle(a.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <AdminUserModal
        open={userModal.open}
        onOpenChange={(open) => setUserModal({ open, user: null })}
        onSuccess={loadAdminData}
        user={userModal.user}
      />

      <AdminProjectModal
        open={projectModal.open}
        onOpenChange={(open) => setProjectModal({ open, project: null })}
        onSuccess={loadAdminData}
        project={projectModal.project}
      />

      <AdminLibraryModal
        open={libraryModal.open}
        onOpenChange={(open) => setLibraryModal({ open, library: null })}
        onSuccess={loadAdminData}
        library={libraryModal.library}
      />

      <AdminArticleModal
        open={articleModal.open}
        onOpenChange={(open) => setArticleModal({ open, article: null })}
        onSuccess={loadAdminData}
        article={articleModal.article}
      />
    </div>
  )
}
