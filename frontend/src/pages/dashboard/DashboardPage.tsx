import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { projectsApi, statisticsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FolderOpen, FileDown, Archive, FileText } from 'lucide-react'
import type { Project, Statistics } from '@/types'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        projectsApi.list({ limit: 4 }),
        statisticsApi.getUserStats(),
      ])

      if (projectsRes.success && projectsRes.data) {
        setRecentProjects(projectsRes.data.slice(0, 4))
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
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

  return (
    <div className="space-y-8">
      {/* MES PROJETS Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-heading text-primary">MES PROJETS</h2>
          <Button
            variant="accent"
            onClick={() => navigate({ to: '/projects/create' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un projet
          </Button>
        </div>

        {recentProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Aucun projet pour le moment</p>
              <Button
                variant="accent"
                onClick={() => navigate({ to: '/projects/create' })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer votre premier projet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentProjects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate({
                  to: `/projects/${project.id}`,
                  search: { from: 'dashboard' }
                })}
              >
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <FileText className="w-20 h-20 text-primary" strokeWidth={1.5} />
                  </div>

                  <h3 className="font-semibold text-lg mb-1 truncate text-center">{project.nom_projet}</h3>
                  <p className="text-sm text-gray-600 mb-2 text-center">{project.client}</p>
                  <div className="flex items-center justify-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.statut)}`}>
                      {project.statut}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* STATISTIQUES Section */}
      <div>
        <h2 className="text-2xl font-bold font-heading text-primary mb-6">STATISTIQUES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Projets actifs</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.projets_actifs || 0}
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
                  <p className="text-sm text-gray-600 mb-1">Exports récents</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.exports_realises || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileDown className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Projets archivés</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.projets_archives || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Archive className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
