export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { secteur, region, page = 1 } = req.query;
  
  try {
    // Mapping codes NAF vers mots-clés simples
    const secteurKeywords = {
      '62': 'informatique',
      '47': 'commerce',
      '56': 'restauration',
      '41': 'construction',
      '43': 'travaux',
      '68': 'immobilier',
      '70': 'conseil',
      '73': 'publicité',
      '85': 'santé'
    };
    
    // Mapping codes postaux vers villes
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
      '38': 'grenoble'
    };
    
    // Construction recherche simple
    let searchTerms = [];
    
    if (secteur) {
      // Prendre les 2 premiers chiffres du code NAF
      const codeBase = secteur.substring(0, 2);
      const keyword = secteurKeywords[codeBase] || 'entreprise';
      searchTerms.push(keyword);
    }
    
    if (region) {
      const regionCode = region.substring(0, 2);
      const regionName = regionNames[regionCode] || '';
      if (regionName) {
        searchTerms.push(regionName);
      }
    }
    
    const query = searchTerms.length > 0 ? searchTerms.join(' ') : 'france';
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=${
