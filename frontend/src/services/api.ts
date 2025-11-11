import type { ApiResponse, LoginCredentials, RegisterData, User } from '@/types'

// Frontend sur http://localhost:5173, Backend sur http://localhost/metr2/backend/api
const API_BASE_URL = 'http://localhost/metr2/backend/api'

/**
 * Helper function to make API requests
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    ...options,
    credentials: 'include', // Include cookies for session
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    // Try to parse JSON
    const text = await response.text()

    try {
      const data = JSON.parse(text)
      return data
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Response text:', text)
      return {
        success: false,
        error: 'Réponse invalide du serveur',
      }
    }
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: 'Erreur de connexion au serveur',
    }
  }
}

/**
 * Auth API
 */
export const authApi = {
  login: async (credentials: LoginCredentials) => {
    return request<User>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  register: async (data: RegisterData) => {
    return request<User>('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  logout: async () => {
    return request('/auth/logout.php', {
      method: 'POST',
    })
  },

  checkAuth: async () => {
    return request<User>('/auth/check.php')
  },

  googleLogin: async () => {
    return request<{ auth_url: string, client_id: string }>('/auth/google-login.php')
  },
}

/**
 * Users API
 */
export const usersApi = {
  getMe: async () => {
    return request<User>('/users/me.php')
  },

  updateProfile: async (data: Partial<User>) => {
    return request<User>('/users/me.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return request('/users/password.php', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },
}

/**
 * Projects API
 */
export const projectsApi = {
  list: async (filters?: any) => {
    const params = filters ? `?${new URLSearchParams(filters)}` : ''
    return request('/projects/list.php' + params)
  },

  get: async (id: number) => {
    return request(`/projects/get.php?id=${id}`)
  },

  create: async (data: any) => {
    return request('/projects/create.php', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: number, data: any) => {
    return request('/projects/update.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    })
  },

  delete: async (id: number) => {
    return request(`/projects/delete.php?id=${id}`, {
      method: 'DELETE',
    })
  },

  import: async (formData: FormData) => {
    return fetch(`${API_BASE_URL}/projects/import.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData, // Don't set Content-Type for FormData
    }).then(res => res.json())
  },

  // Project Libraries
  getLibraries: async (projectId: number) => {
    return request(`/projects/libraries.php?project_id=${projectId}`)
  },

  assignLibrary: async (projectId: number, libraryId: number) => {
    return request('/projects/assign_library.php', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, library_id: libraryId }),
    })
  },

  unassignLibrary: async (projectId: number, libraryId: number) => {
    return request('/projects/unassign_library.php', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, library_id: libraryId }),
    })
  },

  // Documents
  uploadDocument: async (projectId: number, type: 'plan' | 'document', file: File) => {
    const formData = new FormData()
    formData.append('project_id', projectId.toString())
    formData.append('type', type)
    formData.append('file', file)

    return fetch(`${API_BASE_URL}/projects/upload_document.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(res => res.json())
  },

  getDocuments: async (projectId: number) => {
    return request(`/projects/get_documents.php?project_id=${projectId}`)
  },

  deleteDocument: async (docId: number) => {
    return request(`/projects/delete_document.php?id=${docId}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Libraries API
 */
export const librariesApi = {
  list: async () => {
    return request('/libraries/list.php')
  },

  create: async (data: any) => {
    return request('/libraries/create.php', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: number, data: any) => {
    return request('/libraries/update.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    })
  },

  delete: async (id: number) => {
    return request(`/libraries/delete.php?id=${id}`, {
      method: 'DELETE',
    })
  },

  import: async (formData: FormData) => {
    return fetch(`${API_BASE_URL}/libraries/import.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData, // Don't set Content-Type for FormData
    }).then(res => res.json())
  },

  // Library Projects
  getProjects: async (libraryId: number) => {
    return request(`/libraries/projects.php?library_id=${libraryId}`)
  },
}

/**
 * Articles API
 */
export const articlesApi = {
  list: async (libraryId?: number, filters?: any) => {
    let url = '/articles/list.php'
    const params: any = {}
    if (libraryId) params.library_id = libraryId
    if (filters) Object.assign(params, filters)
    if (Object.keys(params).length > 0) {
      url += `?${new URLSearchParams(params)}`
    }
    return request(url)
  },

  create: async (data: any) => {
    return request('/articles/create.php', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: number, data: any) => {
    return request('/articles/update.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    })
  },

  delete: async (id: number) => {
    return request(`/articles/delete.php?id=${id}`, {
      method: 'DELETE',
    })
  },

  moveToLibrary: async (articleIds: number[], targetLibraryId: number) => {
    return request('/articles/move.php', {
      method: 'PUT',
      body: JSON.stringify({ article_ids: articleIds, target_library_id: targetLibraryId }),
    })
  },
}

/**
 * Statistics API
 */
export const statisticsApi = {
  getUserStats: async () => {
    return request('/statistics/user.php')
  },

  getAdminStats: async () => {
    return request('/statistics/admin.php')
  },
}

/**
 * Admin API
 */
export const adminApi = {
  // Users
  getUsers: async () => {
    return request('/admin/users.php')
  },

  updateUser: async (id: number, data: any) => {
    return request('/admin/update_user.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    })
  },

  deleteUser: async (id: number) => {
    return request(`/admin/user.php?id=${id}`, {
      method: 'DELETE',
    })
  },

  // Projects
  getAllProjects: async () => {
    return request('/admin/projects.php')
  },

  updateProject: async (id: number, data: any) => {
    return request('/admin/update_project.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    })
  },

  deleteProject: async (id: number) => {
    return request(`/admin/delete_project.php?id=${id}`, {
      method: 'DELETE',
    })
  },

  // Libraries
  getAllLibraries: async () => {
    return request('/admin/libraries.php')
  },

  deleteLibrary: async (id: number) => {
    return request(`/admin/delete_library.php?id=${id}`, {
      method: 'DELETE',
    })
  },

  // Articles
  getAllArticles: async () => {
    return request('/admin/articles.php')
  },

  deleteArticle: async (id: number) => {
    return request(`/admin/delete_article.php?id=${id}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Chiffrage API
 */
export const chiffrageApi = {
  get: async (projectId: number) => {
    return request(`/chiffrage/get.php?project_id=${projectId}`)
  },

  exportExcel: (projectId: number) => {
    const url = `${API_BASE_URL}/chiffrage/export_excel.php?project_id=${projectId}`
    window.open(url, '_blank')
  },
}

// Backward compatibility alias
export const devisApi = chiffrageApi
