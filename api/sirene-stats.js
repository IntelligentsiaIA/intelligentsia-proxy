export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { secteur = '', region = '', limit = '10', page = '1' } = req.query;
    
    // Query simple
    let q = secteur.toLowerCase();
    
    // Nettoyage secteur
    q = q.replace(/activités pour la /gi, '');
    q = q.replace(/activités /gi, '');
    q = q.replace(/ humaine/gi, '');
    
    // Mapping régions → départements (codes postaux)
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
    
    // URL API Gouv
    const perPage = Math.min(parseInt(limit), 25);
    const apiUrl = new URL('https://recherche-entreprises.api.gouv.fr/search');
    apiUrl.searchParams.set('q', q);
    apiUrl.searchParams.set('per_page', perPage.toString());
    apiUrl.searchParams.set('page', page);
    
    // Fetch
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error('API Gouv error ' + response.status);
    }
    
    const data = await response.json();
    
    // Parse minimal
    const entreprises = [];
    for (const e of (data.results || [])) {
      entreprises.push({
        siren: e.siren || '',
        nom: e.nom_complet || e.nom_raison_sociale || '',
        secteur: e.activite_principale || '',
        ville: (e.siege && e.siege.libelle_commune) || '',
        codePostal: (e.siege && e.siege.code_postal) || '',
        region: (e.siege && e.siege.libelle_region) || '',
        dateCreation: e.date_creation || e.date_debut_activite || null,
        effectif: e.tranche_effectif_salarie || null
      });
    }
    
    // Filtre région par CODE POSTAL (plus fiable que nom région)
    let filtered = entreprises;
    if (region) {
      const regionLower = region.toLowerCase().replace(/ /g, '-');
      const depts = regionDepts[regionLower] || [];
      
      if (depts.length > 0) {
        // Filtre par département (2 premiers chiffres code postal)
        filtered = entreprises.filter(e => {
          if (!e.codePostal) return false;
          const dept = e.codePostal.substring(0, 2);
          return depts.includes(dept);
        });
      } else {
        // Fallback : filtre textuel sur nom région (si rempli)
        filtered = entreprises.filter(e => {
          const eRegion = (e.region || '').toLowerCase();
          return eRegion.includes(regionLower.replace(/-/g, ' '));
        });
      }
    }
    
    // Stats basiques
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
    
    const effectifCount = {};
    for (const e of filtered) {
      const eff = e.effectif || '00';
      effectifCount[eff] = (effectifCount[eff] || 0) + 1;
    }
    
    // Regroupe TPE/PME/ETI
    let tpe = 0;
    let pme = 0;
    let eti = 0;
    
    for (const [code, count] of Object.entries(effectifCount)) {
      if (['00', '01', '02', '03'].includes(code)) tpe += count;
      else if (['11', '12', '21', '22'].includes(code)) pme += count;
      else if (['31', '32', '41', '42', '51', '52', '53'].includes(code)) eti += count;
    }
    
    return res.status(200).json({
      total: data.total_results || 0,
      totalFiltered: filtered.length,
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
