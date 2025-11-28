export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q, rows = 20 } = req.query;
  
  try {
    // API PLACE (marchés publics)
    const url = `https://data.economie.gouv.fr/api/records/1.0/search/?dataset=decp&q=${encodeURIComponent(q)}&rows=${rows}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`PLACE API error: ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Erreur PLACE:', error);
    return res.status(500).json({ 
      error: 'Erreur API PLACE', 
      message: error.message 
    });
  }
}
