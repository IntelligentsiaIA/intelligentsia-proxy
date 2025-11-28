export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;
  
  try {
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=10`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return res.status(200).json(data);
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
