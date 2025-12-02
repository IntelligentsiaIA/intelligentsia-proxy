export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ⚠️ IMPORTANT : Récupérer 'q' au lieu de 'secteur'
  const { q, secteur, zone, rows = 20 } = req.query;
  
  const searchTerm = q || secteur || '';
  
  if (!searchTerm) {
    return res.status(400).json({ error: 'Paramètre q ou secteur requis' });
  }
  
  try {
    // URL corrigée avec bon format de recherche
    const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp_augmente/records?where=search(objet, "${searchTerm}")&limit=${rows}&order_by=date_publication DESC`;
    
    console.log('[PLACE] URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PLACE] Erreur:', response.status, errorText);
      throw new Error(`PLACE API ${response.status}`);
    }
    
    const data = await response.json();
    
    // Formater résultats
    const formatted = {
      total: data.total_count || 0,
      marches: (data.results || []).map(m => ({
        id: m.id,
        titre: m.objet || 'Sans titre',
        montant: m.montant || 0,
        montantFormate: m.montant ? `${parseFloat(m.montant).toLocaleString('fr-FR')} €` : 'NC',
        acheteur: m.acheteur_nom || 'Non spécifié',
        datePublication: m.date_publication,
        lieuExecution: m.lieu_execution_type_nom || 'France',
        niveauDifficulte: classifyForTPE(m.montant),
        lien: `https://data.economie.gouv.fr/explore/dataset/decp_augmente/table/?refine.id=${m.id}`
      }))
    };
    
    return res.status(200).json(formatted);
    
  } catch (error) {
    console.error('[PLACE] Exception:', error);
    return res.status(500).json({ 
      error: 'Erreur API PLACE', 
      message: error.message 
    });
  }
}

function classifyForTPE(montant) {
  if (!montant) return { niveau: 'Inconnu', color: 'gray', badge: '❓', conseil: 'Montant NC' };
  const m = parseFloat(montant);
  if (m < 25000) return { niveau: 'Débutant', color: 'green', badge: '🟢', conseil: 'Idéal pour démarrer' };
  if (m < 100000) return { niveau: 'Intermédiaire', color: 'orange', badge: '🟠', conseil: 'Nécessite références' };
  return { niveau: 'Expert', color: 'red', badge: '🔴', conseil: 'Grandes entreprises' };
}
