import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { projectsApi } from '@/services/api'
import { Project } from '@/types'
import { Loader2, FolderKanban } from 'lucide-react'

interface AssignProjectsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  libraryId: number
  libraryName: string
  onSuccess: () => void
}

export function AssignProjectsModal({ open, onOpenChange, libraryId, libraryName, onSuccess }: AssignProjectsModalProps) {
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [assignedProjectIds, setAssignedProjectIds] = useState<Set<number>>(new Set())
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, libraryId])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      // Charger tous les projets
      const projectsResponse = await projectsApi.list()
      if (!projectsResponse.success) {
        throw new Error(projectsResponse.error || 'Erreur lors du chargement des projets')
      }

      // Charger les bibliothèques de chaque projet pour voir lesquels ont déjà cette bibliothèque
      const projects = projectsResponse.data || []
      const assignedIds = new Set<number>()

      // Pour chaque projet, vérifier s'il utilise déjà cette bibliothèque
      for (const project of projects) {
        const librariesResponse = await projectsApi.getLibraries(project.id)
        if (librariesResponse.success && librariesResponse.data) {
          const hasLibrary = librariesResponse.data.some((lib: any) => lib.id === libraryId)
          if (hasLibrary) {
            assignedIds.add(project.id)
          }
        }
      }

      setAllProjects(projects)
      setAssignedProjectIds(assignedIds)
      setSelectedProjectIds(new Set(assignedIds))

    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleProject = (projectId: number) => {
    const newSelected = new Set(selectedProjectIds)
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId)
    } else {
      newSelected.add(projectId)
    }
    setSelectedProjectIds(newSelected)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      // Projets à assigner (nouvelles sélections)
      const toAssign = Array.from(selectedProjectIds).filter(id => !assignedProjectIds.has(id))

      // Projets à désassigner (retirés de la sélection)
      const toUnassign = Array.from(assignedProjectIds).filter(id => !selectedProjectIds.has(id))

      // Exécuter les assignations
      for (const projectId of toAssign) {
        const response = await projectsApi.assignLibrary(projectId, libraryId)
        if (!response.success) {
          throw new Error(`Erreur lors de l'assignation: ${response.error}`)
        }
      }

      // Exécuter les désassignations
      for (const projectId of toUnassign) {
        const response = await projectsApi.unassignLibrary(projectId, libraryId)
        if (!response.success) {
          throw new Error(`Erreur lors du retrait: ${response.error}`)
        }
      }

      onSuccess()
      onOpenChange(false)

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assigner la bibliothèque aux projets</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">{libraryName}</p>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          ) : allProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Aucun projet disponible.</p>
              <p className="text-sm mt-1">Créez d'abord des projets pour pouvoir leur assigner cette bibliothèque.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {allProjects.map((project) => {
                const isSelected = selectedProjectIds.has(project.id)
                return (
                  <div
                    key={project.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => handleToggleProject(project.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleProject(project.id)}
                      className="mt-1"
                    />
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <FolderKanban className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{project.nom_projet}</div>
                        <div className="text-sm text-gray-600">{project.client}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getStatusColor(project.statut)}`}>
                            {project.statut}
                          </span>
                          {project.typologie && (
                            <span className="text-xs text-gray-500">{project.typologie}</span>
                          )}
                          {project.phase && (
                            <span className="text-xs text-blue-600">{project.phase}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={handleSave}
            disabled={saving || loading || allProjects.length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
