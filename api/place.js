export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q, secteur, zone, rows } = req.query;
  const searchTerm = q || secteur || '';
  const limit = rows || 20;
  
  if (!searchTerm) {
    return res.status(400).json({ 
      error: 'Paramètre q ou secteur requis' 
    });
  }
  
  try {
    // ✅ URL simplifiée qui fonctionne
    const baseUrl = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp_augmente/records';
    const url = `${baseUrl}?limit=${limit}&order_by=date_publication DESC`;
    
    console.log('[PLACE] Appel:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[PLACE] Erreur HTTP:', response.status);
      return res.status(500).json({ 
        error: `API PLACE ${response.status}` 
      });
    }
    
    const data = await response.json();
    
    if (!data.results) {
      console.error('[PLACE] Pas de résultats dans la réponse');
      return res.status(500).json({ 
        error: 'Format de réponse invalide' 
      });
    }
    
    // Filtrer côté serveur si terme de recherche
    let results = data.results;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(m => {
        const objet = (m.objet || '').toLowerCase();
        return objet.includes(searchLower);
      });
    }
    
    // Formater les résultats
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
    
    console.log(`[PLACE] ${formatted.total} marchés trouvés`);
    
    return res.status(200).json(formatted);
    
  } catch (error) {
    console.error('[PLACE] Exception:', error.message);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

function classifyForTPE(montant) {
  if (!montant || montant === 0) {
    return { 
      niveau: 'Inconnu', 
      color: 'gray', 
      badge: '❓', 
      conseil: 'Montant non communiqué' 
    };
  }
  
  if (montant < 25000) {
    return { 
      niveau: 'Débutant', 
      color: 'green', 
      badge: '🟢', 
      conseil: 'Idéal pour démarrer sans références' 
    };
  }
  
  if (montant < 100000) {
