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
  
  const apiKey = process.env.INSEE_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API INSEE manquante' });
  }
  
  try {
    // NOUVELLE URL portail API INSEE 2025
    const url = `https://api.insee.fr/api-sirene/3.11/siret?q=${encodeURIComponent(q)}&nombre=${nombre}`;
    
    const response = await fetch(url, {
      headers: {
        // Nouveau format avec Authorization Bearer
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur détaillée:', {
        status: response.status,
        url: url,
        keyPrefix: apiKey.substring(0, 8) + '...',
        error: errorText
      });
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
