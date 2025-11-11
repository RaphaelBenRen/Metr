import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, MoreVertical, Edit, Trash2, FolderPlus } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Project, ProjectFolder } from '@/types'
import { foldersApi } from '@/services/api'

interface FolderTreeProps {
  folders: ProjectFolder[]
  projects: Project[]
  onFolderClick?: (folder: ProjectFolder) => void
  onProjectClick?: (project: Project) => void
  onEditFolder?: (folder: ProjectFolder) => void
  onDeleteFolder?: (folder: ProjectFolder) => void
  onCreateSubFolder?: (parentFolder: ProjectFolder) => void
  onRefresh?: () => void
  selectedFolderId?: number | null
  selectedProjectId?: number | null
}

interface TreeNodeProps {
  folder: ProjectFolder
  projects: Project[]
  subFolders: ProjectFolder[]
  level: number
  isExpanded: boolean
  onToggle: () => void
  onFolderClick?: (folder: ProjectFolder) => void
  onProjectClick?: (project: Project) => void
  onEditFolder?: (folder: ProjectFolder) => void
  onDeleteFolder?: (folder: ProjectFolder) => void
  onCreateSubFolder?: (parentFolder: ProjectFolder) => void
  onDrop?: (projectId: number, folderId: number | null) => void
  selectedFolderId?: number | null
  selectedProjectId?: number | null
}

function TreeNode({
  folder,
  projects,
  subFolders,
  level,
  isExpanded,
  onToggle,
  onFolderClick,
  onProjectClick,
  onEditFolder,
  onDeleteFolder,
  onCreateSubFolder,
  onDrop,
  selectedFolderId,
  selectedProjectId,
}: TreeNodeProps) {
  const [dragOver, setDragOver] = useState(false)
  const hasChildren = subFolders.length > 0 || projects.length > 0
  const isSelected = selectedFolderId === folder.id

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const projectId = parseInt(e.dataTransfer.getData('projectId'))
    if (projectId && onDrop) {
      onDrop(projectId, folder.id)
    }
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group hover:bg-gray-100 transition-colors ${
          isSelected ? 'bg-blue-50 border border-blue-200' : ''
        } ${dragOver ? 'bg-blue-100 border-2 border-blue-400' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          onToggle()
          if (onFolderClick) onFolderClick(folder)
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren && (
          <button onClick={(e) => { e.stopPropagation(); onToggle() }} className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        {isExpanded ? (
          <FolderOpen className="w-4 h-4" style={{ color: folder.couleur }} />
        ) : (
          <Folder className="w-4 h-4" style={{ color: folder.couleur }} />
        )}

        <span className="flex-1 text-sm font-medium text-gray-900">{folder.nom}</span>

        <span className="text-xs text-gray-500 mr-2">
          {projects.length}
        </span>

        {!folder.is_system && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (onCreateSubFolder) onCreateSubFolder(folder) }}>
                <FolderPlus className="w-4 h-4 mr-2" />
                Nouveau sous-dossier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (onEditFolder) onEditFolder(folder) }}>
                <Edit className="w-4 h-4 mr-2" />
                Renommer
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={(e) => { e.stopPropagation(); if (onDeleteFolder) onDeleteFolder(folder) }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {isExpanded && projects.length > 0 && (
        <div>
          {projects.map(project => (
            <ProjectNode
              key={project.id}
              project={project}
              level={level + 1}
              onClick={onProjectClick}
              isSelected={selectedProjectId === project.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ProjectNodeProps {
  project: Project
  level: number
  onClick?: (project: Project) => void
  isSelected: boolean
}

function ProjectNode({ project, level, onClick, isSelected }: ProjectNodeProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('projectId', project.id.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border border-blue-200' : ''
      }`}
      style={{ paddingLeft: `${level * 16 + 24}px` }}
      onClick={() => onClick && onClick(project)}
      draggable
      onDragStart={handleDragStart}
    >
      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
      <span className="flex-1 text-sm text-gray-700 truncate">{project.nom_projet}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        project.statut === 'En cours' ? 'bg-green-100 text-green-800' :
        project.statut === 'Terminé' ? 'bg-blue-100 text-blue-800' :
        project.statut === 'Archivé' ? 'bg-gray-100 text-gray-800' :
        'bg-orange-100 text-orange-800'
      }`}>
        {project.statut}
      </span>
    </div>
  )
}

// Recursive wrapper that gets data from parent
function FolderTreeNode({
  folder,
  level,
  folders,
  projects,
  expandedFolders,
  onToggle,
  ...otherProps
}: {
  folder: ProjectFolder
  level: number
  folders: ProjectFolder[]
  projects: Project[]
  expandedFolders: Set<number>
  onToggle: (id: number) => void
  onFolderClick?: (folder: ProjectFolder) => void
  onProjectClick?: (project: Project) => void
  onEditFolder?: (folder: ProjectFolder) => void
  onDeleteFolder?: (folder: ProjectFolder) => void
  onCreateSubFolder?: (parentFolder: ProjectFolder) => void
  onDrop?: (projectId: number, folderId: number | null) => void
  selectedFolderId?: number | null
  selectedProjectId?: number | null
}) {
  const subFolders = folders.filter(f => f.parent_folder_id === folder.id)
  const folderProjects = projects.filter(p => p.folder_id === folder.id)

  return (
    <div>
      <TreeNode
        folder={folder}
        projects={folderProjects}
        subFolders={subFolders}
        level={level}
        isExpanded={expandedFolders.has(folder.id)}
        onToggle={() => onToggle(folder.id)}
        {...otherProps}
      />
      {expandedFolders.has(folder.id) && (
        <div>
          {subFolders.map(subFolder => (
            <FolderTreeNode
              key={subFolder.id}
              folder={subFolder}
              level={level + 1}
              folders={folders}
              projects={projects}
              expandedFolders={expandedFolders}
              onToggle={onToggle}
              {...otherProps}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree({
  folders,
  projects,
  onFolderClick,
  onProjectClick,
  onEditFolder,
  onDeleteFolder,
  onCreateSubFolder,
  onRefresh,
  selectedFolderId,
  selectedProjectId,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())

  // Build folder hierarchy
  const rootFolders = folders.filter(f => !f.parent_folder_id)

  const toggleFolder = (folderId: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleDrop = async (projectId: number, folderId: number | null) => {
    try {
      const response = await foldersApi.moveProject(projectId, folderId)
      if (response.success && onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error moving project:', error)
    }
  }

  return (
    <div className="space-y-0.5">
      {rootFolders.map(folder => (
        <FolderTreeNode
          key={folder.id}
          folder={folder}
          level={0}
          folders={folders}
          projects={projects}
          expandedFolders={expandedFolders}
          onToggle={toggleFolder}
          onFolderClick={onFolderClick}
          onProjectClick={onProjectClick}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
          onCreateSubFolder={onCreateSubFolder}
          onDrop={handleDrop}
          selectedFolderId={selectedFolderId}
          selectedProjectId={selectedProjectId}
        />
      ))}
    </div>
  )
}
