import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Folder, FolderOpen, ChevronRight, ChevronDown, Home } from 'lucide-react'
import type { ProjectFolder } from '@/types'

interface MoveFolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: ProjectFolder[]
  itemType: 'project' | 'folder'
  itemId: number
  currentFolderId: number | null
  onMove: (destinationFolderId: number | null) => Promise<void>
}

interface FolderNodeProps {
  folder: ProjectFolder
  allFolders: ProjectFolder[]
  level: number
  selectedFolderId: number | null
  onSelect: (folderId: number | null) => void
  expandedFolders: Set<number>
  onToggle: (folderId: number) => void
  disabledFolderId?: number
}

function FolderNode({
  folder,
  allFolders,
  level,
  selectedFolderId,
  onSelect,
  expandedFolders,
  onToggle,
  disabledFolderId,
}: FolderNodeProps) {
  const isExpanded = expandedFolders.has(folder.id)
  const isSelected = selectedFolderId === folder.id
  const isDisabled = disabledFolderId === folder.id
  const subFolders = allFolders.filter((f) => f.parent_folder_id === folder.id)
  const hasChildren = subFolders.length > 0

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-100 border border-blue-400'
            : isDisabled
            ? 'bg-gray-100 cursor-not-allowed opacity-50'
            : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => !isDisabled && onSelect(folder.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(folder.id)
            }}
            className="p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {isExpanded ? (
          <FolderOpen className="w-4 h-4" style={{ color: folder.couleur }} />
        ) : (
          <Folder className="w-4 h-4" style={{ color: folder.couleur }} />
        )}

        <span className="flex-1 text-sm font-medium text-gray-900">
          {folder.nom}
        </span>
      </div>

      {isExpanded &&
        subFolders.map((subFolder) => (
          <FolderNode
            key={subFolder.id}
            folder={subFolder}
            allFolders={allFolders}
            level={level + 1}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            expandedFolders={expandedFolders}
            onToggle={onToggle}
            disabledFolderId={disabledFolderId}
          />
        ))}
    </div>
  )
}

export function MoveFolderModal({
  open,
  onOpenChange,
  folders,
  itemType,
  itemId,
  currentFolderId,
  onMove,
}: MoveFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    currentFolderId
  )
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  // Get root folders
  const rootFolders = folders.filter((f) => !f.parent_folder_id)

  const toggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleMove = async () => {
    setLoading(true)
    try {
      await onMove(selectedFolderId)
      onOpenChange(false)
    } catch (error) {
      console.error('Error moving item:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Déplacer {itemType === 'project' ? 'le projet' : 'le dossier'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 py-4 border-t border-b">
          {/* Root option */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
              selectedFolderId === null
                ? 'bg-blue-100 border border-blue-400'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => setSelectedFolderId(null)}
          >
            <Home className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Racine</span>
          </div>

          {/* Folder tree */}
          {rootFolders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              allFolders={folders}
              level={0}
              selectedFolderId={selectedFolderId}
              onSelect={setSelectedFolderId}
              expandedFolders={expandedFolders}
              onToggle={toggleFolder}
              disabledFolderId={itemType === 'folder' ? itemId : undefined}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleMove}
            disabled={loading || selectedFolderId === currentFolderId}
          >
            {loading ? 'Déplacement...' : 'Déplacer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
