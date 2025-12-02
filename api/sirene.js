export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { activite, departement, per_page } = req.query;
  const limit = per_page || 100;
  
  if (!activite || !departement) {
    return res.status(400).json({ 
      error: 'Paramètres activite et departement requis' 
    });
  }
  
  try {
    // API Recherche Entreprises (gouvernement français - gratuite)
    const url = `https://recherche-entreprises.api.gouv.fr/search?activite_principale=${activite}&departement=${departement}&per_page=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `API error ${response.status}` 
      });
    }
    
    const data = await response.json();
    
    // Format compatible Sirene
    const results = data.results || [];
    const formatted = {
      total_results: data.total_results || 0,
      etablissements: results.map(item => {
        const siege = item.siege || {};
        return {
          siret: siege.siret || item.siren || '',
          date_creation: item.date_creation_entreprise || null,
          libelle_commune: siege.libelle_commune || '',
          geo_adresse: siege.geo_adresse || siege.libelle_commune || '',
          tranche_effectifs: item.tranche_effectif_salarie_entreprise?.code || 'NN',
          activite_principale: item.activite_principale || activite,
          nom_complet: item.nom_complet || item.nom_raison_sociale || ''
        };
      })
    };
    
    return res.status(200).json(formatted);
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
