export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { activite, departement, per_page = 100 } = req.query;
  
  if (!activite || !departement) {
    return res.status(400).json({ 
      error: 'Paramètres requis' 
    });
  }
  
  try {
    // ✅ API ALTERNATIVE : Recherche Entreprises (Gouv.fr - GRATUITE)
    // Plus stable que api-sirene.data.gouv.fr
    const url = `https://recherche-entreprises.api.gouv.fr/search?activite_principale=${activite}&departement=${departement}&per_page=${per_page}&minimal=false`;
    
    console.log('[ENTREPRISES] Appel:', url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Intelligentsia/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ENTREPRISES] Erreur:', response.status, errorText);
      throw new Error(`API ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transformer au format Sirene pour compatibilité
    const formatted = {
      total_results: data.total_results || 0,
      etablissements: (data.results || []).map(e => ({
        siret: e.siege?.siret || e.siren,
        date_creation: e.date_creation_entreprise,
        libelle_commune: e.siege?.libelle_commune || 'NC',
        geo_adresse: e.siege?.geo_adresse || e.siege?.libelle_commune,
        tranche_effectifs: e.tranche_effectif_salarie_entreprise?.code || 'NN',
        activite_principale: e.activite_principale,
        nom_complet: e.nom_complet || e.nom_raison_sociale
      }))
    };
    
    console.log(`[ENTREPRISES] ${formatted.total_results} résultats trouvés`);
    
    return res.status(200).json(formatted);
    
  } catch (error) {
    console.error('
