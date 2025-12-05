export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { secteur, region, type } = req.query;
  
  try {
    let url = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/sirene-v3/records?limit=100';
    
    // Filtrer par secteur (code NAF)
    if (secteur) {
      url += `&where=activiteprincipaleunitelegale:"${secteur}"`;
    }
    
    // Filtrer par région (code département)
    if (region) {
      url += `${secteur ? ' AND ' : '&where='}codeCommuneEtablissement like "${region}%"`;
    }
    
    // Stats agrégées
    if (type === 'stats') {
      url += '&select=count(*) as total&group_by=trancheeffectifsunitelegale';
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `Open Data Soft ${response.status}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    
    // Formater les résultats
    const results = data.results || [];
    
    if (type === 'stats') {
      // Stats agrégées
      return res.status(200).json({
        total: data.total_count || 0,
        repartition: results.map(r => ({
          tranche: r.trancheeffectifsunitelegale || 'Non renseigné',
          nombre: r.total || 0
        }))
      });
    }
    
    // Liste d'entreprises
    return res.status(200).json({
      total: data.total_count || 0,
      entreprises: results.slice(0, 20).map(e => ({
        siren: e.siren,
        nom: e.denominationunitelegale || 'Non renseigné',
        secteur: e.activiteprincipaleunitelegale,
        ville: e.libellecommuneetablissement,
        codePostal: e.codepostaletablissement,
        effectif: e.trancheeffectifsunitelegale,
        dateCreation: e.datecreationunitelegale
      }))
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
