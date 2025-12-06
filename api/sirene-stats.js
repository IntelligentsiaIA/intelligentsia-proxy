export default async function handler(req, res) {
  // ✅ CORS headers EN PREMIER
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { secteur, region, limite = 10, page = 1 } = req.query;
  
  try {
    const searchTerms = [];
    if (secteur) searchTerms.push(secteur);
    if (region) searchTerms.push(region);
    
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(searchTerms.join(' '))}&page=${page}&per_page=${Math.min(limite, 25)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    
    return res.status(200).json({
      total: data.total_results || 0,
      entreprises: (data.results || []).map(e => ({
        siren: e.siren,
        nom: e.nom_complet || e.nom_raison_sociale,
        secteur: e.activite_principale,
        ville: e.siege?.libelle_commune,
        codePostal: e.siege?.code_postal,
        region: e.siege?.libelle_region
      })),
      stats: {
        parSecteur: {},
        parRegion: {}
      }
    });
  } catch (error) {
    console.error('Sirene error:', error);
    return res.status(500).json({ error: error.message });
  }
}
