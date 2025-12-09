// src/components/utils/apiPlaceApi.jsx

// Fonction pour construire l'URL d'accès au marché public
export function construireUrlMarche(marche) {
  // 1. Si le marché a un identifiant BOAMP, utiliser boamp.fr
  if (marche.idBoamp || marche.idweb) {
    const idBoamp = marche.idBoamp || marche.idweb;
    return `https://www.boamp.fr/avis/detail/${idBoamp}`;
  }
  
  // 2. Si le marché a un numéro d'annonce, utiliser boamp.fr
  if (marche.numero_annonce) {
    return `https://www.boamp.fr/pages/avis/?q=${encodeURIComponent(marche.numero_annonce)}`;
  }
  
  // 3. Sinon, recherche sur marches-publics.gouv.fr avec le titre
  if (marche.objet || marche.titre) {
    const titre = marche.objet || marche.titre;
    return `https://www.marches-publics.gouv.fr/?page=entreprise.AccueilEntreprise&AllCons&refConsultation=${encodeURIComponent(titre)}`;
  }
  
  // 4. Fallback : recherche générale data.gouv.fr
  const query = marche.acheteur?.nom || marche.objet || 'marché public';
  return `https://www.data.gouv.fr/fr/datasets/?q=${encodeURIComponent(query)}`;
}

// Formater montant (déjà OK)
export function formaterMontant(montant) {
  if (!montant || montant === 0) return 'Non précisé';
  if (montant < 1000) return `${montant}€`;
  if (montant < 1000000) return `${(montant / 1000).toFixed(0)}k€`;
  return `${(montant / 1000000).toFixed(1)}M€`;
}

// Calculer difficulté selon profil entreprise
function calculerDifficulte(montant, profilEntreprise) {
  const seuils = {
    'TPE': { facile: 25000, moyen: 50000, difficile: 100000 },
    'PME': { facile: 100000, moyen: 300000, difficile: 500000 },
    'Startup': { facile: 50000, moyen: 150000, difficile: 300000 },
    'Industrie': { facile: 500000, moyen: 2000000, difficile: 5000000 },
    'Conseil': { facile: 75000, moyen: 200000, difficile: 400000 },
  };

  const profil = seuils[profilEntreprise] || seuils['TPE'];

  if (montant === 0 || !montant) return { niveau: 'Inconnu', color: 'gray' };
  if (montant <= profil.facile) return { niveau: 'Facile', color: 'green' };
  if (montant <= profil.moyen) return { niveau: 'Moyen', color: 'yellow' };
  if (montant <= profil.difficile) return { niveau: 'Difficile', color: 'orange' };
  return { niveau: 'Expert', color: 'red' };
}

// Fonction principale fetchMarchesPublics
export async function fetchMarchesPublics({ secteur, codePostal, profilEntreprise, limite = 20 }) {
  try {
    console.log('🔍 [Marchés Publics] Recherche:', { secteur, codePostal, profilEntreprise, limite });

    // Mots-clés selon secteur
    const motsCles = {
      'restauration': 'restauration repas cuisine cantine',
      'commerce': 'commerce vente magasin retail',
      'tech': 'informatique logiciel numérique digital',
      'batiment': 'construction travaux bâtiment rénovation',
      'conseil': 'conseil formation audit étude',
      'default': secteur.toLowerCase()
    };

    const keywords = motsCles[secteur.toLowerCase()] || motsCles['default'];
    console.log('🔑 Mots-clés:', keywords);

    // Appel API via proxy Base44
    const apiUrl = `/api/proxy/marches-publics?q=${encodeURIComponent(keywords)}&rows=100`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    let marches = data.results || [];
    console.log('📦 Marchés reçus du proxy:', marches.length);

    // FILTRE GÉOGRAPHIQUE (code postal)
    if (codePostal) {
      marches = marches.filter(m => {
        const lieu = m.lieuExecution?.code || m.lieu_execution?.code || '';
        return lieu.startsWith(codePostal.substring(0, 2));
      });
      console.log('📍 Après filtre géo:', marches.length);
    }

    // FILTRE MONTANT selon profil
    const limitesMontant = {
      'TPE': 25000,
      'PME': 100000,
      'Startup': 50000,
      'Industrie': 500000,
      'Conseil': 75000,
      'Toutes tailles': 999999999
    };
    const montantMax = limitesMontant[profilEntreprise] || 100000;

    marches = marches.filter(m => {
      const montant = m.montant || m.montantEstime || 0;
      return montant === 0 || montant <= montantMax;
    });
    console.log('💰 Après filtre montant:', marches.length);

    // FORMATER RÉSULTATS
    const marchesFormates = marches.slice(0, limite).map(m => ({
      id: m.id || m.uid || Math.random().toString(36),
      titre: m.objet || m.titre || 'Marché public',
      acheteur: m.acheteur?.nom || m.acheteurNom || 'Organisme public',
      montant: m.montant || m.montantEstime || 0,
      lieu: m.lieuExecution?.nom || m.lieu_execution?.nom || 'France',
      date_limite: m.dateLimiteCandidature || m.dateEcheance || 'Non précisé',
      type_marche: m.nature || m.typeMarche || 'Fournitures et services',
      cpv: m.codeCPV || m.cpv || '',
      difficulte: calculerDifficulte(m.montant || m.montantEstime || 0, profilEntreprise),
      url_source: construireUrlMarche(m), // ✅ URL CORRIGÉE
      idBoamp: m.idBoamp || m.idweb || null,
      numero_annonce: m.numero_annonce || m.numeroAnnonce || null
    }));

    console.log('✅ [Marchés Publics] Trouvés:', marchesFormates.length, 'marchés');

    return {
      total: marchesFormates.length,
      marches: marchesFormates
    };

  } catch (error) {
    console.error('❌ [Marchés Publics] Erreur:', error);
    return { total: 0, marches: [] };
  }
}
