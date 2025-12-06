export default async function handler(req, res) {
  // ✅ CORS headers EN PREMIER
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { secteur, region, limit = 10, page = 1 } = req.query;
  
  try {
    // Construction query intelligente
    const searchTerms = [];
    
    // Mapping secteurs vers mots-clés larges
    const secteurMap = {
      'restauration': 'restaurant',
      'tech': 'informatique',
      'commerce': 'commerce',
      'batiment': 'construction',
      'sante': 'santé',
      'services': 'service'
    };
    
    const secteurQuery = secteurMap[secteur?.toLowerCase()] || secteur || '';
    if (secteurQuery) searchTerms.push(secteurQuery);
    
    // Mapping régions vers départements principaux
    const regionMap = {
      'hauts-de-france': '59 62 80 02 60', // Nord, Pas-de-Calais, Somme, Aisne, Oise
      'ile-de-france': '75 92 93 94 77 78 91 95',
      'normandie': '14 27 50 61 76',
      'nouvelle-aquitaine': '16 17 19 23 24 33 40 47 64 79 86 87',
      'occitanie': '09 11 12 30 31 32 34 46 48 65 66 81 82',
      'auvergne-rhone-alpes': '01 03 07 15 26 38 42 43 63 69 73 74',
      'grand-est': '08 10 51 52 54 55 57 67 68 88',
      'bourgogne-franche-comte': '21 25 39 58 70 71 89 90',
      'bretagne': '22 29 35 56',
      'centre-val-de-loire': '18 28 36 37 41 45',
      'pays-de-la-loire': '44 49 53 72 85',
      'provence-alpes-cote-azur': '04 05 06 13 83 84'
    };
    
    const regionQuery = regionMap[region?.toLowerCase()] || region || '';
    
    // Appel API avec per_page max (25) et gestion pagination
    const perPage = Math.min(parseInt(limit) || 25, 25);
    const apiUrl = new URL('https://recherche-entreprises.api.gouv.fr/search');
    
    // Query textuelle large
    if (searchTerms.length > 0) {
      apiUrl.searchParams.append('q', searchTerms.join(' '));
    }
    
    // Filtres structurés
    if (regionQuery) {
      // Cherche dans tous les départements de la région
      const depts = regionQuery.split(' ');
      apiUrl.searchParams.append('code_postal', depts[0]); // Utilise le 1er dept comme base
    }
    
    apiUrl.searchParams.append('per_page', perPage.toString());
    apiUrl.searchParams.append('page', page.toString());
    
    console.log('🔍 [Sirene Proxy] URL:', apiUrl.toString());
    
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`API Gouv error: ${response.status}`);
    }
    
    const data = await response.json();
