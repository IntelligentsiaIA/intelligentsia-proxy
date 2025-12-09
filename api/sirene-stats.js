export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { secteur = '', region = '', limit = '10' } = req.query;
    
    // Nettoyage secteur
    let q = secteur.toLowerCase()
      .replace(/activités pour la /gi, '')
      .replace(/activités /gi, '')
      .replace(/ humaine/gi, '');
    
    // Départements par région
    const regionDepts = {
      'hauts-de-france': ['59', '62', '80', '02', '60'],
      'ile-de-france': ['75', '77', '78', '91', '92', '93', '94', '95'],
      'normandie': ['14', '27', '50', '61', '76'],
      'nouvelle-aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
      'occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
      'auvergne-rhone-alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
      'grand-est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
      'bourgogne-franche-comte': ['21', '25', '39', '58', '70', '71', '89', '90'],
      'bretagne': ['22', '29', '35', '56'],
      'centre-val-de-loire': ['18', '28', '36', '37', '41', '45'],
      'pays-de-la-loire': ['44', '49', '53', '72', '85'],
      'provence-alpes-cote-azur': ['04', '05', '06', '13', '83', '84']
    };
    
    const targetLimit = Math.min(parseInt(limit) || 10, 100);
    let allEntreprises = [];
    let page = 1;
    const maxPages = 4; // Fetch jusqu'à 100 résultats (4 pages × 25)
    
    // Fetch plusieurs pages jusqu'à avoir assez de résultats filtrés
    while (allEntreprises.length < targetLimit && page <= maxPages) {
      const apiUrl = new URL('https://recherche-entreprises.api.gouv.fr/search');
      apiUrl.searchParams.set('q', q);
      apiUrl.searchParams.set('per_page', '25');
      apiUrl.searchParams.set('page', page.toString());
      
      const response = await fetch(apiUrl.toString());
      
      if (!response.ok) {
        throw new Error('API error ' + response.status);
      }
      
      const data = await response.json();
      
      // Parse entreprises
      for (const e of (data.results || [])) {
        const entreprise = {
          siren: e.siren || '',
          nom: e.nom_complet || e.nom_raison_sociale || '',
          secteur: e.activite_principale || '',
          ville: (e.siege && e.siege.libelle_commune) || '',
          codePostal: (e.siege && e.siege.code_postal) || '',
          region: (e.siege && e.siege.libelle_region) || '',
          dateCreation: e.date_creation || e.date_debut_activite || null,
          effectif: e.tranche_effectif_salarie || null
        };
        
        // Filtre région immédiatement
        if (region) {
          const regionLower = region.toLowerCase().replace(/ /g, '-');
          const depts = regionDepts[regionLower] || [];
          
          if (depts.length > 0 && entreprise.codePostal) {
            const dept = entreprise.codePostal.substring(0, 2);
            if (depts.includes(dept)) {
              allEntreprises.push(entreprise);
            }
          }
        } else {
          // Pas de filtre région
          allEntreprises.push(entreprise);
        }
        
        // Stop si limite atteinte
        if (allEntreprises.length >= targetLimit) {
          break;
        }
      }
      
      // Si plus de résultats API, stop
      if (!data.results || data.results.length === 0) {
        break;
      }
      
      page++;
    }
    
    // Limite finale
    const filtered = allEntreprises.slice(0, targetLimit);
    
    // Stats
    const villesCount = {};
    for (const e of filtered) {
      if (e.ville) {
        villesCount[e.ville] = (villesCount[e.ville] || 0) + 1;
      }
    }
    
    const topVilles = Object.entries(villesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ville, nombre]) => ({ ville, nombre }));
    
    let tpe = 0;
    let pme = 0;
    let eti = 0;
    
    for (const e of filtered) {
      const eff = e.effectif || '00';
      if (['00', '01', '02', '03'].includes(eff)) tpe++;
      else if (['11', '12', '21', '22'].includes(eff)) pme++;
      else if (['31', '32', '41', '42', '51', '52', '53'].includes(eff)) eti++;
    }
    
    return res.status(200).json({
      total: 10000,
      totalFiltered: filtered.length,
      pagesFetched: page - 1,
      entreprises: filtered,
      stats: {
        repartitionEffectif: {
          'TPE': tpe,
          'PME': pme,
          'ETI': eti
        },
        topVilles: topVilles
      }
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      total: 0,
      entreprises: [],
      stats: {}
    });
  }
}
