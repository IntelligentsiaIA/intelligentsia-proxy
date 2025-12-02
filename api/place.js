export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { secteur, zone, rows = 20 } = req.query;
  
  if (!secteur) {
    return res.status(400).json({ error: 'Paramètre secteur requis' });
  }
  
  try {
    // ✅ URL CORRIGÉE 2025 - Dataset DECP actualisé
    const searchQuery = zone ? `${secteur} ${zone}` : secteur;
    const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp_augmente/records?where=search(objet, "${encodeURIComponent(secteur)}")&limit=${rows}&order_by=date_publication DESC`;
    
    console.log('[PLACE] Appel:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`PLACE API ${response.status}`);
    }
    
    const data = await response.json();
    
    // Formater pour TPE/PME
    const formatted = {
      total: data.total_count || 0,
      marches: (data.results || []).map(m => ({
        id: m.id,
        titre: m.objet || 'Sans titre',
        montant: m.montant ? parseFloat(m.montant) : 0,
        montantFormate: m.montant ? `${parseFloat(m.montant).toLocaleString('fr-FR')} €` : 'Non communiqué',
        acheteur: m.acheteur_nom || 'Non spécifié',
        datePublication: m.date_publication || null,
        dateNotification: m.date_notification || null,
        lieuExecution: m.lieu_execution_type_nom || zone || 'France',
        
        // Classification TPE/PME
        niveauDifficulte: classifyForTPE(m.montant),
        
        // Lien vers source officielle
        lien: `https://data.economie.gouv.fr/explore/dataset/decp_augmente/table/?refine.id=${m.id}`
      }))
    };
    
    return res.status(200).json(formatted);
    
  } catch (error) {
    console.error('[PLACE] Erreur:', error);
    return res.status(500).json({ 
      error: 'Erreur API PLACE', 
      message: error.message 
    });
  }
}

// Classification par pertinence TPE/PME
function classifyForTPE(montant) {
  if (!montant || montant === 0) return { 
    niveau: 'Inconnu', 
    color: 'gray',
    badge: '❓',
    conseil: 'Montant non communiqué'
  };
  
  const m = parseFloat(montant);
  
  if (m < 25000) return { 
    niveau: 'Débutant', 
    color: 'green',
    badge: '🟢',
    conseil: 'Idéal pour démarrer - Peu de contraintes'
  };
  
  if (m < 100000) return { 
    niveau: 'Intermédiaire', 
    color: 'orange',
    badge: '🟠',
    conseil: 'Nécessite quelques références clients'
  };
  
  return { 
    niveau: 'Expert', 
    color: 'red',
    badge: '🔴',
    conseil: 'Réservé aux entreprises expérimentées'
  };
}
