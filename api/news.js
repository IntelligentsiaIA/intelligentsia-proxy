export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // DEBUG : Afficher si la clé existe
  const apiKey = process.env.NEWSAPI_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'NEWSAPI_KEY manquante',
      debug: {
        hasEnv: !!process.env,
        envKeys: Object.keys(process.env).filter(k => k.includes('NEWS'))
      }
    });
  }

  // Reste du code...
  const { q, lang = 'fr', limit = 10 } = req.query;
  
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&sortBy=publishedAt&pageSize=${limit}&apiKey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'error') {
      return res.status(400).json({ error: data.message });
    }
    
    return res.status(200).json({
      total: data.totalResults || 0,
      articles: (data.articles || []).map(a => ({
        titre: a.title,
        description: a.description,
        url: a.url,
        source: a.source.name,
        datePublication: a.publishedAt,
        image: a.urlToImage
      }))
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
