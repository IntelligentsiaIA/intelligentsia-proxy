export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { input } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_KEY;

  if (!input) {
    return res.status(400).json({ error: 'Paramètre "input" manquant' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_KEY non configurée dans Vercel' });
  }

  try {
    const cleanInput = input.trim();
    
    // Étape 1 : Trouver le place_id
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(cleanInput)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' || !searchData.candidates || searchData.candidates.length === 0) {
      return res.status(404).json({ 
        error: 'Établissement non trouvé',
        debug: {
          status: searchData.status,
          input: cleanInput
        }
      });
    }

    const placeId = searchData.candidates[0].place_id;

    // Étape 2 : Récupérer les détails et avis
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,user_ratings_total,reviews&key=${apiKey}&language=fr`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK') {
      return res.status(500).json({ 
        error: 'Erreur récupération détails',
        status: detailsData.status 
      });
    }

    return res.status(200).json(detailsData.result);
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
