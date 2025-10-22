// User Types
export interface User {
  id: number
  nom: string
  prenom: string
  email: string
  entreprise?: string
  telephone?: string
  photo_profil?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

// Project Types
export type ProjectStatus = 'En cours' | 'Brouillon' | 'Terminé' | 'Archivé'
export type ProjectTypology =
  | 'Maison individuelle'
  | 'Immeuble résidentiel'
  | 'Bureau'
  | 'Commerce'
  | 'Industriel'
  | 'Équipement public'
  | 'Autre'

export interface Project {
  id: number
  user_id: number
  nom_projet: string
  client: string
  reference_interne?: string
  typologie: ProjectTypology
  adresse?: string
  date_livraison_prevue?: string
  statut: ProjectStatus
  surface_totale?: number
  created_at: string
  updated_at: string
}

// Library Types
export interface Library {
  id: number
  user_id: number
  nom: string
  description?: string
  is_global?: boolean
  created_at: string
  updated_at: string
}

// Article Types
export type ArticleLot =
  | '1- TERRASSEMENTS GÉNÉRAUX'
  | '2- GROS ŒUVRE - MAÇONNERIE'
  | '3- MÉTALLERIE, FERRONNERIE'
  | '4- PLÂTRERIE'
  | '5- ISOLATION'
  | '6- CARRELAGES, REVÊTEMENTS'
  | '7- SOLS SOUPLES'
  | '8- PEINTURES'
  | '9- MENUISERIES INTÉRIEURES'
  | '10- MENUISERIES EXTÉRIEURES'
  | '11- ÉLECTRICITÉ COURANTS FORTS'
  | '12- PLOMBERIES SANITAIRES'
  | '13- COUVERTURE, ZINGUERIE'
  | '14- ÉTANCHÉITÉ'
  | '15- STORES ET FERMETURES'
  | '16- VRD, ESPACES EXTÉRIEURS'

export type ArticleUnit = 'M2' | 'M3' | 'L' | 'U'
export type ArticleStatus = 'Nouveau' | 'En cours' | 'Validé'

export interface Article {
  id: number
  library_id: number
  designation: string
  lot: ArticleLot
  sous_categorie?: string
  unite: ArticleUnit
  prix_unitaire: number
  is_favorite: boolean
  statut: ArticleStatus
  created_at: string
  updated_at: string
}

// Document Types
export type DocumentType = 'plan' | 'document'

export interface ProjectDocument {
  id: number
  project_id: number
  type: DocumentType
  nom_fichier: string
  nom_original?: string
  chemin_fichier: string
  format?: string
  taille_fichier?: number
  uploaded_at: string
}

// Statistics Types
export interface Statistics {
  id: number
  user_id: number
  mois: string
  projets_actifs: number
  projets_archives: number
  surface_mesuree: number
  exports_realises: number
  created_at: string
  updated_at: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Auth Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  nom: string
  prenom: string
  email: string
  password: string
  entreprise?: string
  telephone?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
