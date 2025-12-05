export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { secteur, region, page = 1 } = req.query;
  
  try {
    // Mapping codes NAF vers mots-clés de recherche
    const secteurKeywords = {
      '62.01': 'informatique programmation logiciel',
      '62.02': 'conseil informatique',
      '62': 'informatique',
      '47': 'commerce',
      '56': 'restauration',
      '41': 'construction',
      '43': 'travaux',
      '68': 'immobilier'
    };
    
    // Mapping codes postaux vers noms de villes/régions
    const regionNames = {
      '75': 'paris',
      '69': 'lyon',
      '13': 'marseille',
      '31': 'toulouse',
      '33': 'bordeaux',
      '44': 'nantes',
      '59': 'lille',
      '67': 'strasbourg',
      '06': 'nice',
      '34': 'montpellier',
      '35': 'rennes',
      '38': 'grenoble',
      '76': 'rouen',
      '21': 'dijon',
      '45': 'orléans',
      '2A': 'ajaccio',
      '2B': 'bastia'
    };
    
    // Construction de la recherche avec mots-clés intelligents
    let searchTerms = [];
    
    if (secteur) {
      // Chercher le code NAF le plus proche
      let keyword = secteur;
      for (let code in secteurKeywords) {
        if (secteur.startsWith(code)) {
          keyword = secteurKeywords[code];
          break;
        }
      }
      searchTerms.push(keyword);
    }
    
    if (region) {
      const regionCode = region.substring(0, 2).toUpperCase();
      const regionName = regionNames[regionCode] || regionNames[region] || region;
      searchTerms.push(regionName);
    }
    
    const query = searchTerms.length > 0 ? searchTerms.join(' ') : 'france';
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=${page}&per_page=25`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `API Gouv ${response.status}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    let results = data.results || [];
    
    // Filtrage souple côté serveur
    if (secteur && results.length > 0) {
      const secteurClean = secteur.replace('.', '');
      results = results.filter(e => {
        if (!e.activite_principale) return false;
        const apClean = e.activite_principale.replace('.', '');
        return apClean.startsWith(secteurClean.substring(0, 2));
      });
    }
    
    if (region && results.length > 0) {
      const regionPrefix = region.substring(0, 2);
      results = results.filter(e => 
        e.siege?.code_postal && 
        e.siege.code_postal.startsWith(regionPrefix)
      );
    }
    
    // Formater les résultats
    return res.status(200).json({
      total: results.length,
      totalAPI: data.total_results || 0,
      page: parseInt(page),
      totalPages: Math.ceil((data.total_results || 0) / 25),
      recherche: query,
      entreprises: results.map(e => ({
        siren: e.siren,
        nom: e.nom_complet || e.nom_raison_sociale,
        secteur: e.activite_principale,
        secteurLibelle: e.libelle_activite_principale,
        ville: e.siege?.libelle_commune,
        codePostal: e.siege?.code_postal,
        region: e.siege?.libelle_region,
        effectif: e.tranche_effectif_salarie,
        effectifLibelle: getEffectifLibelle(e.tranche_effectif_salarie
