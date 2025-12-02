export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q, rows } = req.query;
  const limit = rows || 20;
  
  if (!q) {
    return res.status(400).json({ error: 'Paramètre q requis' });
  }
  
  try {
    const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp_augmente/records?limit=${limit}&order_by=date_publication%20DESC`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(500).json({ error: `API PLACE ${response.status}` });
    }
    
    const data = await response.json();
    let results = data.results || [];
    
    // Filtrer côté serveur
    const searchLower = q.toLowerCase();
    results = results.filter(m => {
      const objet = (m.objet || '').toLowerCase();
      return objet.includes(searchLower);
    });
    
    const formatted = {
      total: results.length,
      marches: results.map(m => ({
        id: m.id || '',
        titre: m.objet || 'Sans titre',
        montant: parseFloat(m.montant) || 0,
        montantFormate: m.montant 
          ? `${parseFloat(m.montant).toLocaleString('fr-FR')} €` 
          : 'Non communiqué',
        acheteur: m.acheteur_nom || 'Non spécifié',
        datePublication: m.date_publication || null,
        lieuExecution: m.lieu_execution_type_nom || 'France',
        niveauDifficulte: classifyForTPE(parseFloat(m.montant) || 0),
        lien: `https://data.economie.gouv.fr/explore/dataset/decp_augmente/table/?refine.id=${m.id || ''}`
      }))
    };
    
    return res.status(200).json(formatted);
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message
    });
  }
}

function classifyForTPE(montant) {
  if (!montant) {
    return { niveau: 'Inconnu', color: 'gray', badge: '❓', conseil: 'Montant NC' };
  }
  if (montant < 25000) {
    return { niveau: 'Débutant', color: 'green', badge: '🟢', conseil: 'Idéal pour démarrer' };
  }
  if (montant < 100000) {
    return { niveau: 'Intermédiaire', color: 'orange', badge: '🟠', conseil: 'Quelques références demandées' };
  }
  return { niveau: 'Expert', color: 'red', badge: '🔴', conseil: 'Grandes entreprises' };
}
