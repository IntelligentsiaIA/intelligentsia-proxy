export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query; // Query string
  
  try {
    const url = `https://api.insee.fr/entreprises/sirene/V3/siret?q=${encodeURIComponent(q)}&nombre=100`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.INSEE_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`INSEE API error: ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Erreur INSEE:', error);
    return res.status(500).json({ 
      error: 'Erreur API INSEE', 
      message: error.message 
    });
  }
}
