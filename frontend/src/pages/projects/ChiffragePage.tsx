import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { chiffrageApi } from '@/services/api'
import { ArrowLeft, Download, FileText } from 'lucide-react'

interface ChiffrageLigne {
  lot: string
  total: number
  ordre: number
}

interface ChiffrageData {
  chiffrage: {
    id: number
    numero_chiffrage: string
    date_creation: string
    date_validite: string | null
    statut: string
    notes: string | null
    total_ht: number
  }
  project: {
    id: number
    nom_projet: string
    client: string
    reference_interne: string | null
    adresse: string | null
  }
  lignes: ChiffrageLigne[]
  total_ht: number
}

export function ChiffragePage() {
  const navigate = useNavigate()
  const { projectId } = useParams({ strict: false })

  // Get navigation source from URL search params
  const getFromSource = () => {
    const params = new URLSearchParams(window.location.search)
    const from = params.get('from')
    const fromFolder = params.get('from_folder')

    if (from === 'dashboard') {
      return { type: 'dashboard' as const }
    } else if (fromFolder) {
      return { type: 'folder' as const, folderId: parseInt(fromFolder) }
    }
    return { type: 'projects' as const }
  }

  const fromSource = getFromSource()
  const [chiffrageData, setChiffrageData] = useState<ChiffrageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadChiffrage()
  }, [projectId])

  const loadChiffrage = async () => {
    if (!projectId) {
      setError('ID projet manquant')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await chiffrageApi.get(Number(projectId))

      if (response.success && response.data) {
        setChiffrageData(response.data)
      } else {
        setError(response.error || 'Erreur lors du chargement du chiffrage')
      }
    } catch (err) {
      console.error('Error loading chiffrage:', err)
      setError('Erreur lors du chargement du chiffrage')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (projectId) {
      chiffrageApi.exportExcel(Number(projectId))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du chiffrage...</p>
        </div>
      </div>
    )
  }

  if (error || !chiffrageData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Chiffrage non disponible
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => {
                const search: any = {}
                if (fromSource.type === 'dashboard') {
                  search.from = 'dashboard'
                } else if (fromSource.type === 'folder') {
                  search.from_folder = fromSource.folderId
                }
                navigate({
                  to: `/projects/${projectId}`,
                  search: Object.keys(search).length > 0 ? search : undefined
                })
              }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au projet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              const search: any = {}
              if (fromSource.type === 'dashboard') {
                search.from = 'dashboard'
              } else if (fromSource.type === 'folder') {
                search.from_folder = fromSource.folderId
              }
              navigate({
                to: `/projects/${projectId}`,
                search: Object.keys(search).length > 0 ? search : undefined
              })
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Chiffrage {chiffrageData.chiffrage.numero_chiffrage}
            </h1>
            <p className="text-gray-600">{chiffrageData.project.nom_projet}</p>
          </div>
        </div>
        <Button onClick={handleExport} size="lg" className="flex items-center">
          <Download className="h-5 w-5 mr-2" />
          Exporter en Excel
        </Button>
      </div>

      {/* Chiffrage Preview - Excel Style */}
      <Card className="max-w-4xl mx-auto shadow-lg bg-white">
        <CardContent className="p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">CHIFFRAGE</h1>
          </div>

          {/* Chiffrage Info */}
          <div className="mb-8 space-y-2">
            <div className="grid grid-cols-[180px,1fr] gap-2">
              <div className="font-medium text-gray-700">N° Chiffrage:</div>
              <div className="text-gray-900">{chiffrageData.chiffrage.numero_chiffrage}</div>
            </div>
            <div className="grid grid-cols-[180px,1fr] gap-2">
              <div className="font-medium text-gray-700">Date:</div>
              <div className="text-gray-900">{formatDate(chiffrageData.chiffrage.date_creation)}</div>
            </div>
          </div>

          {/* Project Info */}
          <div className="mb-8 space-y-2">
            <div className="grid grid-cols-[180px,1fr] gap-2">
              <div className="font-medium text-gray-700">Projet:</div>
              <div className="text-gray-900">{chiffrageData.project.nom_projet}</div>
            </div>
            <div className="grid grid-cols-[180px,1fr] gap-2">
              <div className="font-medium text-gray-700">Client:</div>
              <div className="text-gray-900">{chiffrageData.project.client}</div>
            </div>
            {chiffrageData.project.reference_interne && (
              <div className="grid grid-cols-[180px,1fr] gap-2">
                <div className="font-medium text-gray-700">Référence:</div>
                <div className="text-gray-900">{chiffrageData.project.reference_interne}</div>
              </div>
            )}
          </div>

          {/* Chiffrage Table */}
          <div className="mb-6">
            <div className="overflow-hidden border border-gray-300 rounded-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#4F46E5] text-white">
                    <th className="px-6 py-3 text-left text-sm font-bold border-r border-[#3e38c7]">
                      Lot
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-bold">
                      Total (EUR)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {chiffrageData.lignes.map((ligne, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="px-6 py-3 text-sm text-gray-900 border-r border-gray-300">
                        {ligne.lot}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-gray-900 tabular-nums">
                        {ligne.total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-white border-t-2 border-gray-400">
                    <td className="px-6 py-3 text-sm font-bold text-gray-900 border-r border-gray-300">
                      TOTAL HT
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-bold text-gray-900 tabular-nums">
                      {chiffrageData.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {chiffrageData.chiffrage.notes && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {chiffrageData.chiffrage.notes}
              </p>
            </div>
          )}

          {/* Status Badge */}
          <div className="mt-6 flex justify-end">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                chiffrageData.chiffrage.statut === 'valide'
                  ? 'bg-green-100 text-green-800'
                  : chiffrageData.chiffrage.statut === 'brouillon'
                  ? 'bg-gray-100 text-gray-800'
                  : chiffrageData.chiffrage.statut === 'envoye'
                  ? 'bg-blue-100 text-blue-800'
                  : chiffrageData.chiffrage.statut === 'accepte'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              Statut: {chiffrageData.chiffrage.statut.charAt(0).toUpperCase() + chiffrageData.chiffrage.statut.slice(1)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
