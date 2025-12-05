export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { secteur, region } = req.query;
    
    let query = 'france';
    if (secteur && region) {
      query = `informatique ${region === '75' ? 'paris' : 'france'}`;
    } else if (secteur) {
      query = 'informatique';
    } else if (region) {
      query = region === '75' ? 'paris' : 'france';
    }
    
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=25`;
    const response = await fetch(url);
    const data = await response.json();
    
    const entreprises = (data.results || []).map(e => ({
      siren: e.siren,
      nom: e.nom_complet || e.nom_raison_sociale,
      secteur: e.activite_principale,
      ville: e.siege?.libelle_commune,
      codePostal: e.siege?.code_postal,
      region: e.siege?.libelle_region
    }));
    
    return res.status(200).json({
      total: entreprises.length,
      entreprises
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
