export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q, lang = 'fr', limit = 10 } = req.query;
  
  // Votre clé NewsAPI (à mettre dans les variables d'environnement Vercel)
  const apiKey = process.env.NEWSAPI_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'NEWSAPI_KEY manquante' });
  }
  
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&sortBy=publishedAt&pageSize=${limit}&apiKey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'error') {
      return res.status(400).json({ error: data.message });
    }
    
    const articles = (data.articles || []).map(a => ({
      titre: a.title,
      description: a.description,
      url: a.url,
      source: a.source.name,
      datePublication: a.publishedAt,
      image: a.urlToImage
    }));
    
    return res.status(200).json({
      total: data.totalResults || 0,
      articles
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
