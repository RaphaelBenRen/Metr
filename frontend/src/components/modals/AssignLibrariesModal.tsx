import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { projectsApi, librariesApi } from '@/services/api'
import { Library } from '@/types'
import { Loader2, Folder } from 'lucide-react'

interface AssignLibrariesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number
  projectName: string
  onSuccess: () => void
}

export function AssignLibrariesModal({ open, onOpenChange, projectId, projectName, onSuccess }: AssignLibrariesModalProps) {
  const [allLibraries, setAllLibraries] = useState<Library[]>([])
  const [assignedLibraryIds, setAssignedLibraryIds] = useState<Set<number>>(new Set())
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, projectId])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      // Charger toutes les bibliothèques
      const librariesResponse = await librariesApi.list()
      if (!librariesResponse.success) {
        throw new Error(librariesResponse.error || 'Erreur lors du chargement des bibliothèques')
      }

      // Charger les bibliothèques assignées au projet
      const assignedResponse = await projectsApi.getLibraries(projectId)
      if (!assignedResponse.success) {
        throw new Error(assignedResponse.error || 'Erreur lors du chargement des assignations')
      }

      const libraries = librariesResponse.data || []
      const assigned = assignedResponse.data || []
      const assignedIds = new Set(assigned.map((lib: any) => lib.id))

      setAllLibraries(libraries)
      setAssignedLibraryIds(assignedIds)
      setSelectedLibraryIds(new Set(assignedIds))

    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLibrary = (libraryId: number) => {
    const newSelected = new Set(selectedLibraryIds)
    if (newSelected.has(libraryId)) {
      newSelected.delete(libraryId)
    } else {
      newSelected.add(libraryId)
    }
    setSelectedLibraryIds(newSelected)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      // Bibliothèques à assigner (nouvelles sélections)
      const toAssign = Array.from(selectedLibraryIds).filter(id => !assignedLibraryIds.has(id))

      // Bibliothèques à désassigner (retirées de la sélection)
      const toUnassign = Array.from(assignedLibraryIds).filter(id => !selectedLibraryIds.has(id))

      // Exécuter les assignations
      for (const libraryId of toAssign) {
        const response = await projectsApi.assignLibrary(projectId, libraryId)
        if (!response.success) {
          throw new Error(`Erreur lors de l'assignation: ${response.error}`)
        }
      }

      // Exécuter les désassignations
      for (const libraryId of toUnassign) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gérer les bibliothèques du projet</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">{projectName}</p>
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
          ) : allLibraries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Aucune bibliothèque disponible.</p>
              <p className="text-sm mt-1">Créez d'abord des bibliothèques pour pouvoir les assigner.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {allLibraries.map((library) => {
                const isSelected = selectedLibraryIds.has(library.id)
                return (
                  <div
                    key={library.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => handleToggleLibrary(library.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleLibrary(library.id)}
                      className="mt-1"
                    />
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <Folder className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{library.nom}</div>
                        {library.description && (
                          <div className="text-sm text-gray-600 mt-1">{library.description}</div>
                        )}
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
            disabled={saving || loading || allLibraries.length === 0}
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
