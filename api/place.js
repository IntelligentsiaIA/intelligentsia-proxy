export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q, rows } = req.query;
  const limit = rows || 200;
  
  try {
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
        return searchTerms.some(term => objet.includes(term));
      });
    }
    
    const formatted = {
      total: results.length,
      marches: results.map(m => ({
        id: m.id_marche || m.id || '',
        titre: m.objet || 'Sans titre',
        montant: parseFloat(m.montant) || 0,
        montantFormate: m.montant 
          ? `${parseFloat(m.montant).toLocaleString('fr-FR')} €` 
          : 'Non communiqué',
        acheteur: m.acheteur_nom || 'Non spécifié',
        dateNotification: m.date_notification || null,
        datePublication: m.date_publication_donnees || null,
        lieuExecution: m.lieu_execution_nom || 'France',
        niveauDifficulte: classifyForTPE(parseFloat(m.montant) || 0),
        lien: `https://data.economie.gouv.fr/explore/dataset/decp-v3-marches-valides/table/?refine.id_marche=${m.id_marche || ''}`
      }))
    };
    
    return res.status(200).json(formatted);
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message,
      stack: error.stack
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

