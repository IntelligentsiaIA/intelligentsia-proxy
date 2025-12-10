// api/proxy-adzuna.js
// Proxy pour contourner CORS Adzuna

export default async function handler(req, res) {
  // Autoriser CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { secteur, limit = 15 } = req.query;

    // Clés depuis variables d'environnement Vercel
    const APP_ID = process.env.VITE_ADZUNA_APP_ID;
    const API_KEY = process.env.VITE_ADZUNA_API_KEY;

    if (!APP_ID || !API_KEY) {
      return res.status(500).json({ 
        error: 'Clés API Adzuna non configurées',
        debug: { APP_ID: !!APP_ID, API_KEY: !!API_KEY }
      });
    }

    const query = encodeURIComponent(secteur || 'tech');
    const url = `https://api.adzuna.com/v1/api/jobs/fr/search/1?app_id=${APP_ID}&app_key=${API_KEY}&results_per_page=${limit}&what=${query}`;

    console.log('📡 Adzuna Proxy - Appel API:', url.replace(API_KEY, '***'));

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Adzuna API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Adzuna API Error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Proxy Adzuna Error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
