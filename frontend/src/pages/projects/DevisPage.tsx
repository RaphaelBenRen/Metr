import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { devisApi } from '@/services/api'
import { ArrowLeft, Download, FileText } from 'lucide-react'

interface DevisLigne {
  lot: string
  total: number
  ordre: number
}

interface DevisData {
  devis: {
    id: number
    numero_devis: string
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
  lignes: DevisLigne[]
  total_ht: number
}

export function DevisPage() {
  const navigate = useNavigate()
  const { projectId } = useParams({ strict: false })
  const [devisData, setDevisData] = useState<DevisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDevis()
  }, [projectId])

  const loadDevis = async () => {
    if (!projectId) {
      setError('ID projet manquant')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await devisApi.get(Number(projectId))

      if (response.success && response.data) {
        setDevisData(response.data)
      } else {
        setError(response.error || 'Erreur lors du chargement du devis')
      }
    } catch (err) {
      console.error('Error loading devis:', err)
      setError('Erreur lors du chargement du devis')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (projectId) {
      devisApi.exportCSV(Number(projectId))
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du devis...</p>
        </div>
      </div>
    )
  }

  if (error || !devisData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Devis non disponible
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => navigate({ to: '/projects' })}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux projets
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
            onClick={() => navigate({ to: '/projects' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Devis {devisData.devis.numero_devis}
            </h1>
            <p className="text-gray-600">{devisData.project.nom_projet}</p>
          </div>
        </div>
        <Button onClick={handleExport} size="lg" className="flex items-center">
          <Download className="h-5 w-5 mr-2" />
          Exporter en CSV
        </Button>
      </div>

      {/* Devis Preview */}
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">DEVIS</CardTitle>
              <p className="text-white/90">N° {devisData.devis.numero_devis}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/90">Date d'émission</p>
              <p className="font-semibold">{formatDate(devisData.devis.date_creation)}</p>
              {devisData.devis.date_validite && (
                <>
                  <p className="text-sm text-white/90 mt-2">Valable jusqu'au</p>
                  <p className="font-semibold">{formatDate(devisData.devis.date_validite)}</p>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Client Info */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Informations client</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Client</p>
                <p className="font-medium text-gray-900">{devisData.project.client}</p>
              </div>
              <div>
                <p className="text-gray-600">Projet</p>
                <p className="font-medium text-gray-900">{devisData.project.nom_projet}</p>
              </div>
              {devisData.project.reference_interne && (
                <div>
                  <p className="text-gray-600">Référence</p>
                  <p className="font-medium text-gray-900">{devisData.project.reference_interne}</p>
                </div>
              )}
              {devisData.project.adresse && (
                <div>
                  <p className="text-gray-600">Adresse</p>
                  <p className="font-medium text-gray-900">{devisData.project.adresse}</p>
                </div>
              )}
            </div>
          </div>

          {/* Devis Table */}
          <div className="mb-6">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lot
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devisData.lignes.map((ligne, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ligne.lot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(ligne.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-primary/5">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-bold text-primary">
                      {formatCurrency(devisData.total_ht)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {devisData.devis.notes && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {devisData.devis.notes}
              </p>
            </div>
          )}

          {/* Status Badge */}
          <div className="mt-6 flex justify-end">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                devisData.devis.statut === 'valide'
                  ? 'bg-green-100 text-green-800'
                  : devisData.devis.statut === 'brouillon'
                  ? 'bg-gray-100 text-gray-800'
                  : devisData.devis.statut === 'envoye'
                  ? 'bg-blue-100 text-blue-800'
                  : devisData.devis.statut === 'accepte'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              Statut: {devisData.devis.statut.charAt(0).toUpperCase() + devisData.devis.statut.slice(1)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
