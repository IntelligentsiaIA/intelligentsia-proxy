export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { dataset, filters } = req.query;
  
  try {
    // API INSEE Sirene - Données entreprises par secteur
    const url = dataset === 'enterprises'
      ? `https://api.insee.fr/entreprises/sirene/V3/siret?q=${encodeURIComponent(filters || '')}&nombre=100`
      : `https://api.insee.fr/series/BDM/data/SERIES_BDM/${filters || 'CLIMAT-AFFAIRES'}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `INSEE API ${response.status}`,
        details: await response.text()
      });
    }
    
    const data = await response.json();
    
    return res.status(200).json(data);
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
