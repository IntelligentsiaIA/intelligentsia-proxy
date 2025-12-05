export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { secteur, region, page = 1 } = req.query;
  
  try {
    // API Recherche Entreprises - Toute la France, gratuit, sans clé
    let searchParams = [];
    
    if (secteur) {
      searchParams.push(`activite_principale:${secteur}*`);
    }
    
    if (region) {
      searchParams.push(`code_postal:${region}*`);
    }
    
    const query = searchParams.join(' AND ') || '*';
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=${page}&per_page=25`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `API Gouv ${response.status}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    // Formater les résultats
    return res.status(200).json({
      total: data.total_results || 0,
      page: data.page || 1,
      totalPages: data.total_pages || 1,
      entreprises: results.map(e => ({
        siren: e.siren,
        nom: e.nom_complet || e.nom_raison_sociale,
        secteur: e.activite_principale,
        secteurLibelle: e.libelle_activite_principale,
        ville: e.siege?.libelle_commune,
        codePostal: e.siege?.code_postal,
        region: e.siege?.libelle_region,
        effectif: e.tranche_effectif_salarie,
        dateCreation: e.date_creation,
        etatAdministratif: e.etat_administratif
      })),
      stats: {
        repartitionEffectif: calculerRepartition(results, 'tranche_effectif_salarie'),
        repartitionRegion: calculerRepartition(results.map(r => ({...r, region: r.siege?.libelle_region})), 'region'),
        topVilles: calculerTopVilles(results)
      }
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}

function calculerRepartition(data, champ) {
  const count = {};
  data.forEach(item => {
    const valeur = item[champ] || 'Non renseigné';
    count[valeur] = (count[valeur] || 0) + 1;
  });
  return Object.entries(count)
    .map(([tranche, nombre]) => ({ tranche, nombre }))
    .sort((a, b) => b.nombre - a.nombre);
}

function calculerTopVilles(data) {
  const count = {};
  data.forEach(item => {
    const ville = item.siege?.libelle_commune || 'Non renseigné';
    if (ville !== 'Non renseigné') {
      count[ville] = (count[ville] || 0) + 1;
    }
  });
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ville, nombre]) => ({ ville, nombre }));
}
