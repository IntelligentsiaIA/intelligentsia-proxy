export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q, nombre = 100 } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Paramètre q requis' });
  }
  
  try {
    // NOUVELLE URL 2025 : api-sirene au lieu de entreprises/sirene
    const url = `https://api.insee.fr/api-sirene/3.11/siret?q=${encodeURIComponent(q)}&nombre=${nombre}`;
    
    const response = await fetch(url, {
      headers: {
        // NOUVEAU HEADER 2025 : X-INSEE-Api-Key-Integration
        'X-INSEE-Api-Key-Integration': process.env.INSEE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`INSEE API ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Erreur INSEE:', error.message);
    return res.status(500).json({ 
      error: 'Erreur API INSEE', 
      message: error.message
    });
  }
}
