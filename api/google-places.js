export default async function handler(req, res) {
  // Gestion CORS
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

  try {
    // Étape 1 : Trouver le place_id
    const searchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(input)}&inputtype=textquery&fields=place_id&key=${apiKey}`
    );
    const searchData = await searchResponse.json();

    if (!searchData.candidates || searchData.candidates.length === 0) {
      return res.status(404).json({ error: 'Établissement non trouvé' });
    }

    const placeId = searchData.candidates[0].place_id;

    // Étape 2 : Récupérer les détails et avis
    const detailsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,user_ratings_total,reviews&key=${apiKey}&language=fr`
    );
    const detailsData = await detailsResponse.json();

    return res.status(200).json(detailsData.result);
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
