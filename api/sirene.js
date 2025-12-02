export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { activite, departement, per_page = 100 } = req.query;
  
  if (!activite || !departement) {
    return res.status(400).json({ 
      error: 'Paramètres activite et departement requis' 
    });
  }
  
  try {
    // API Sirene publique (gratuite, sans clé)
    const url = `https://api-sirene.data.gouv.fr/v3/etablissements?activite_principale=${activite}&departement=${departement}&per_page=${per_page}`;
    
    console.log('[SIRENE] Appel:', url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Sirene API ${response.status}`);
    }
    
    const data = await response.json();
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('[SIRENE] Erreur:', error);
    return res.status(500).json({ 
      error: 'Erreur API Sirene', 
      message: error.message 
    });
  }
}
