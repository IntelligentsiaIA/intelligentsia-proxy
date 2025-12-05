export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;
  
  try {
    // Récupérer 100 marchés (limite max de l'API)
    const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-v3-marches-valides/records?limit=100`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ 
        error: `API PLACE ${response.status}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    let results = data.results || [];
    
    // Filtrer côté serveur si paramètre q fourni
    if (q) {
      const searchTerms = q.toLowerCase().split(' ').filter(t => t.length > 2);
      results = results.filter(m => {
        const objet = (m.objet || '').toLowerCase();
        const acheteur = (m.acheteur_nom || '').toLowerCase();
        const lieu = (m.lieu_execution_nom || '').toLowerCase();
        
        // Chercher dans objet, acheteur ET lieu
        const searchText = `${objet} ${acheteur} ${lieu}`;
        return searchTerms.some(term => searchText.includes(term));
      });
    }
    
    const formatted = {
      total: results.length,
      marches: results.map(m => ({
        id: m.id_marche || m.id || '',
        titre: m.objet || 'Sans titre',
        montant: parseFloat(m.montant) || 0,
        montantFormate: m.montant 
          ? `${parseFloat(m.montant).toLocaleString('fr-FR
