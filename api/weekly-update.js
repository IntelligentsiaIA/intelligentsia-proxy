import fetch from 'node-fetch';

export const config = {
  // S'exécute tous les lundis à 8h du matin
  schedule: '0 8 * * 1'
};

export default async function handler(req, res) {
  // Vérifier que c'est bien un appel cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  
  try {
    console.log('[CRON] Début actualisation hebdomadaire...');
    
    const results = {
      timestamp: new Date().toISOString(),
      updates: []
    };
    
    // Liste des combinaisons secteur/région à mettre à jour
    const configurations = [
      { secteur: 'Restauration', region: 'Île-de-France' },
      { secteur: 'Commerce', region: 'Île-de-France' },
      { secteur: 'Construction', region: 'Île-de-France' },
      { secteur: 'Services informatiques', region: 'Île-de-France' },
      { secteur: 'Restauration', region: 'Auvergne-Rhône-Alpes' },
      // Ajouter d'autres combinaisons selon besoin
    ];
    
    // Actualiser les données pour chaque configuration
    for (const config of configurations) {
      try {
        // Appeler l'API de mise à jour
        const response = await fetch(
          `${process.env.APP_URL}/api/update-data`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          }
        );
        
        const data = await response.json();
        
        results.updates.push({
          secteur: config.secteur,
          region: config.region,
          status: 'success',
          entreprises: data.totalEntreprises,
          marches: data.totalMarches
        });
        
        console.log(`[CRON] ✅ ${config.secteur} - ${config.region}: ${data.totalEntreprises} entreprises`);
        
      } catch (error) {
        results.updates.push({
          secteur: config.secteur,
          region: config.region,
          status: 'error',
          error: error.message
        });
        
        console.error(`[CRON] ❌ Erreur ${config.secteur} - ${config.region}:`, error.message);
      }
      
      // Pause de 2 secondes entre chaque appel pour éviter rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('[CRON] Actualisation terminée');
    
    // Envoyer notification email (optionnel)
    if (process.env.ADMIN_EMAIL) {
      await sendNotificationEmail(results);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Actualisation hebdomadaire terminée',
      results
    });
    
  } catch (error) {
    console.error('[CRON] Erreur globale:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function sendNotificationEmail(results) {
  // À implémenter avec Resend, SendGrid ou autre service email
  console.log('[EMAIL] Notification envoyée:', results.updates.length, 'mises à jour');
}
