export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Seulement POST autorisé
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vérifier que la clé API existe
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'PERPLEXITY_API_KEY non configurée dans les variables Vercel' 
    });
  }

  try {
    // Récupérer le body de la requête
    const { model, messages, temperature, max_tokens } = req.body;

    // Appel à l'API Perplexity
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'sonar',
        messages: messages,
        temperature: temperature ?? 0.2,
        max_tokens: max_tokens ?? 1000
      })
    });

    // Lire la réponse
    const data = await response.json();

    // Renvoyer la réponse avec le bon status
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Erreur proxy Perplexity:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'appel à Perplexity',
      details: error.message 
    });
  }
}
