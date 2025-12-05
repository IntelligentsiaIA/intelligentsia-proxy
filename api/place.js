export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { q } = req.query;
    
    // Appel API
    const url = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-v3-marches-valides/records?limit=100';
    const response = await fetch(url);
    const data = await response.json();
    
    let results = data.results || [];
    
    // Filtre simple
    if (q) {
      const keywords = q.toLowerCase().split(' ');
      results = results.filter(m => {
        const text = `${m.objet || ''} ${m.acheteur_nom || ''} ${m.lieu_execution_nom || ''}`.toLowerCase();
        return keywords.some(k => text.includes(k));
      });
    }
    
    // Format
    const marches = results.map(m => ({
      id: m.id_marche || '',
      titre: m.objet || 'Sans titre',
      montant: parseFloat(m.montant) || 0,
      montantFormate: m.montant ? `${parseFloat(m.montant).toLocaleString('fr-FR')} €` : 'NC',
      acheteur: m.acheteur_nom || 'Non spécifié',
      lieuExecution: m.lieu_execution_nom || 'France',
      niveauDifficulte: getMontantLevel(parseFloat(m.montant) || 0),
      lien: `https://data.economie.gouv.fr/explore/dataset/decp-v3-marches-valides/table/`
    }));
    
    return res.status(200).json({ total: marches.length, marches });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

function getMontantLevel(m) {
  if (!m) return { niveau: 'Inconnu', color: 'gray', badge: '❓', conseil: 'NC' };
  if (m < 25000) return { niveau: 'Débutant', color: 'green', badge: '🟢', conseil: 'TPE' };
  if (m < 100000) return { niveau: 'Intermédiaire', color: 'orange', badge: '🟠', conseil: 'PME' };
  return { niveau: 'Expert', color: 'red', badge: '🔴', conseil: 'Grandes entreprises' };
}
