import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, HelpCircle, Mail, Clock } from 'lucide-react'

interface FAQ {
  q: string
  a: string
}

interface FAQCategory {
  category: string
  questions: FAQ[]
}

export function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const faqs: FAQCategory[] = [
    {
      category: 'Premiers pas',
      questions: [
        {
          q: 'Comment créer mon premier projet ?',
          a: 'Cliquez sur le bouton "Créer un projet" depuis le dashboard ou la page Projets. Remplissez les informations obligatoires : nom du projet, client et typologie. Vous pouvez également ajouter des informations complémentaires comme l\'adresse et la date de livraison prévue.'
        },
        {
          q: 'Comment importer des projets depuis un fichier CSV ?',
          a: 'Depuis la page Projets, cliquez sur "Importer CSV". Téléchargez le modèle CSV pour voir le format attendu. Assurez-vous que les colonnes nom_projet, client et typologie sont présentes et remplies. Sélectionnez ensuite votre fichier CSV et cliquez sur "Importer".'
        },
        {
          q: 'Puis-je modifier un projet après sa création ?',
          a: 'Oui ! Cliquez sur les trois points verticaux sur la carte du projet et sélectionnez "Modifier". Vous pouvez modifier toutes les informations du projet, y compris son statut (Brouillon, En cours, Terminé, Archivé).'
        },
      ]
    },
    {
      category: 'Bibliothèque d\'articles',
      questions: [
        {
          q: 'Comment créer une bibliothèque ?',
          a: 'Depuis la page Bibliothèque, cliquez sur "Nouvelle bibliothèque". Donnez un nom à votre bibliothèque et ajoutez une description optionnelle. Une fois créée, vous pourrez y ajouter des articles via import CSV.'
        },
        {
          q: 'Comment importer des articles dans une bibliothèque ?',
          a: 'Sélectionnez d\'abord la bibliothèque cible, puis cliquez sur "Importer CSV". Téléchargez le modèle pour voir le format attendu. Les colonnes obligatoires sont : designation, lot, unite et prix_unitaire. Sélectionnez votre fichier CSV et cliquez sur "Importer".'
        },
        {
          q: 'Quel format utiliser pour l\'import d\'articles ?',
          a: 'Le fichier CSV doit contenir ces colonnes : designation, lot, sous_categorie, unite, prix_unitaire, statut. Les champs obligatoires sont designation, lot, unite et prix_unitaire. Le lot doit correspondre à l\'un des lots standard (1- TERRASSEMENTS GÉNÉRAUX, 2- GROS ŒUVRE - MAÇONNERIE, etc.).'
        },
        {
          q: 'Comment marquer un article en favori ?',
          a: 'Dans la page Bibliothèque, cliquez sur l\'étoile à côté de l\'article pour le marquer ou le retirer des favoris. Les articles favoris restent en tête de liste pour un accès rapide.'
        },
        {
          q: 'Comment supprimer une bibliothèque ?',
          a: 'Cliquez sur "Gérer les bibliothèques" pour passer en mode gestion. Vous verrez toutes vos bibliothèques sous forme de cartes. Cliquez sur l\'icône de poubelle pour supprimer une bibliothèque. Attention : cette action supprimera tous les articles de la bibliothèque.'
        },
      ]
    },
    {
      category: 'Gestion du compte',
      questions: [
        {
          q: 'Comment modifier mes informations personnelles ?',
          a: 'Allez dans la page "Mon Compte" depuis le menu latéral. Vous pouvez modifier votre nom, prénom, email, entreprise et numéro de téléphone. Cliquez sur "Enregistrer les modifications" pour sauvegarder vos changements.'
        },
        {
          q: 'Comment changer mon mot de passe ?',
          a: 'Dans la page "Mon Compte", rendez-vous dans la section "Sécurité". Entrez votre mot de passe actuel, puis votre nouveau mot de passe deux fois. Le nouveau mot de passe doit contenir au moins 8 caractères. Cliquez sur "Changer le mot de passe" pour valider.'
        },
        {
          q: 'Que faire si j\'ai oublié mon mot de passe ?',
          a: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.'
        },
      ]
    },
    {
      category: 'Import et Export',
      questions: [
        {
          q: 'Quels formats de fichiers sont acceptés pour l\'import ?',
          a: 'Nous acceptons uniquement les fichiers CSV (Comma-Separated Values) pour l\'import de projets et d\'articles. Les fichiers Excel doivent être exportés au format CSV avant l\'import.'
        },
        {
          q: 'Que faire en cas d\'erreur lors de l\'import ?',
          a: 'Après l\'import, un rapport détaillé vous indiquera le nombre d\'éléments importés avec succès et la liste des erreurs rencontrées. Vérifiez que votre fichier respecte le format attendu (téléchargez le modèle) et que tous les champs obligatoires sont remplis.'
        },
        {
          q: 'Puis-je exporter mes données ?',
          a: 'La fonctionnalité d\'export sera bientôt disponible. Vous pourrez exporter vos projets et articles au format CSV et PDF.'
        },
      ]
    },
  ]

  // Filtrer les FAQs basées sur le terme de recherche
  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(faq =>
      faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  const hasResults = filteredFaqs.length > 0

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-3">
        <HelpCircle className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-heading text-gray-900">Centre d'aide</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Rechercher dans l'aide..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchTerm && (
        <div className="text-sm text-gray-600">
          {hasResults ? (
            <span>{filteredFaqs.reduce((acc, cat) => acc + cat.questions.length, 0)} résultat(s) trouvé(s)</span>
          ) : (
            <span className="text-destructive">Aucun résultat trouvé pour "{searchTerm}"</span>
          )}
        </div>
      )}

      {/* FAQ */}
      {hasResults ? (
        <div className="space-y-6">
          {filteredFaqs.map((category, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle>{category.category}</CardTitle>
                <CardDescription>{category.questions.length} question(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {category.questions.map((faq, qIdx) => (
                  <div key={qIdx} className="space-y-2 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <p className="font-semibold text-gray-900 flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      {faq.q}
                    </p>
                    <p className="text-sm text-gray-600 ml-7">{faq.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchTerm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">Aucun résultat trouvé</p>
            <p className="text-sm text-gray-500">Essayez avec d'autres mots-clés</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Support */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Besoin d'aide supplémentaire ?
          </CardTitle>
          <CardDescription>
            Notre équipe support est là pour vous aider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-600">
              Email : <a href="mailto:support@metr.fr" className="text-primary hover:underline font-medium">support@metr.fr</a>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-600">
              Temps de réponse moyen : <span className="font-medium text-gray-900">24h</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
