export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { secteur, region, limit = 10, page = 1 } = req.query;
  
  try {
    // Mapping régions vers départements
    const regionDepts = {
      'hauts-de-france': '59',
      'ile-de-france': '75',
      'normandie': '76',
      'nouvelle-aquitaine': '33',
      'occitanie': '31',
      'auvergne-rhone-alpes': '69',
      'grand-est': '67',
      'bourgogne-franche-comte': '21',
      'bretagne': '35',
      'centre-val-de-loire': '45',
      'pays-de-la-loire': '44',
      'provence-alpes-cote-azur': '13'
    };
    
    // Construction query simple
    let searchQuery = '';
    if (secteur) {
      // Simplifie le secteur (enlève "Activités pour la" etc)
      const secteurSimple = secteur
        .toLowerCase()
        .replace(/activités pour la /gi, '')
        .replace(/activités /gi, '')
        .replace(/ humaine/gi, '');
      searchQuery += secteurSimple;
    }
    
    // API Gouv URL
    const perPage = Math.min(parseInt(limit) || 25, 25);
    const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(searchQuery)}&per_page=${perPage}&page=${page}`;
    
    console.log('[Sirene] URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse entreprises
    const entreprises = (data.results || []).map(e => ({
      siren: e.siren,
      nom: e.nom_complet || e.nom_raison_sociale || 'Non renseigné',
      secteur: e.activite_principale || 'Non renseigné',
      ville: e.siege?.libelle_commune || 'Non renseignée',
      codePostal: e.siege?.code_postal || '',
      region: e.siege?.libelle_region || '',
      dateCreation: e.date_creation || e.date_debut_activite || null,
      effectif: e.tranche_effectif_salarie || null
    }));
    
    // Filtre région côté serveur si demandé
    let filtered = entreprises;
    if (region) {
      const regionLower = region.toLowerCase();
      const dept = regionDepts[regionLower];
      
      if (dept) {
        filtered = entreprises.filter(e => 
          e.codePostal?.startsWith(dept) || 
          e.region?.toLowerCase().includes(regionLower.replace(/-/g, ' '))
        );
      } else {
        // Filtre textuel sur nom région
        filtered = entreprises.filter(e => 
          e.region?.toLowerCase().includes(regionLower.replace(/-/g, ' '))
        );
      }
    }
    
    // Calcul stats basiques
    const stats = {
      repartitionEffectif: {},
      topVilles: []
    };
    
    // Répartition effectifs
    const effectifLabels = {
      '00': 'TPE (0 salarié)',
      '01': 'TPE (1-2 salariés)',
      '02': 'TPE (3-5 salariés)',
      '03': 'TPE (6-9 salariés)',
      '11': 'PME (10-19 salariés)',
      '12': 'PME (20-49 salariés)',
      '21': 'PME (50-99 salariés)',
      '22': 'PME (100-199 salariés)',
      '31': 'ETI (200-249 salariés)',
      '32': 'ETI (250-499 salariés)'
    };
    
    filtered.forEach(e => {
      const label = effectifLabels[e.effectif] || 'Non renseigné';
      stats.repartitionEffectif[label] = (stats.repartitionEffectif[label] || 0) + 1;
    });
    
    // Top villes
    const villesCount = {};
    filtered.forEach(e => {
      if (e.ville && e.ville !== 'Non renseignée') {
        villesCount[e.ville] = (villesCount[e.ville] || 0) + 1;
      }
    });
    
    stats.topVilles = Object.entries(villesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ville, nombre]) => ({ ville, nombre }));
    
    return res.status(200).json({
      total: data.total_results || 0,
      entreprises: filtered,
      stats
    });
    
  } catch (error) {
    console.error('[Sirene] Error:', error.message);
    return res.status(500).json({ 
      error: error.message,
      total: 0,
      entreprises: [],
      stats: {
        repartitionEffectif: {},
        topVilles: []
      }
    });
  }
}
