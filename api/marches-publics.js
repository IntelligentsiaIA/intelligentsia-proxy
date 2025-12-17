export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { secteur, codePostal, limit = 50 } = req.query;
    
    // Construire la query pour l'API française
    const searchQuery = secteur ? `search(objet, "${secteur.split(',')[0]}")` : '';
    const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/referentiel-de-donnees-marches-publics/records?where=${encodeURIComponent(searchQuery)}&limit=${limit}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erreur proxy marchés publics:', error);
    return res.status(500).json({ error: error.message });
  }
}
