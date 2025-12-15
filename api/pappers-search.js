/**
 * Proxy Pappers API - Évite l'exposition de la clé API côté client
 */

const SECTEUR_TO_NAF = {
  'Restauration': '56',
  'Boulangerie': '10.71',
  'Coiffure': '96.02',
  'Commerce': '47',
  'Hébergement': '55',
  'Construction': '41,42,43'
};

const REGIONS_TO_DEPTS = {
  'Auvergne-Rhône-Alpes': '01,03,07,15,26,38,42,43,63,69,73,74',
  'Bourgogne-Franche-Comté': '21,25,39,58,70,71,89,90',
  'Bretagne': '22,29,35,56',
  'Centre-Val de Loire': '18,28,36,37,41,45',
  'Corse': '2A,2B',
  'Grand Est': '08,10,51,52,54,55,57,67,68,88',
  'Hauts-de-France': '02,59,60,62,80',
  'Île-de-France': '75,77,78,91,92,93,94,95',
  'Normandie': '14,27,50,61,76',
  'Nouvelle-Aquitaine': '16,17,19,23,24,33,40,47,64,79,86,87',
  'Occitanie': '09,11,12,30,31,32,34,46,48,65,66,81,82',
  'Pays de la Loire': '44,49,53,72,85',
  "Provence-Alpes-Côte d'Azur": '04,05,06,13,83,84'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { secteur, region, limite = 100, page = 1 } = req.query;
    
    const API_TOKEN = process.env.PAPPERS_API_KEY;

    console.log('🎉 [PROD] PAPPERS_API_KEY trouvée ?', !!API_TOKEN);
    
    if (!API_TOKEN) {
      return res.status(500).json({ 
        error: 'Token non configuré',
        debug: {
          found: !!process.env.EXTERNAL_DATA_TOKEN,
          allKeys: Object.keys(process.env).filter(k => k.includes('TOKEN') || k.includes('EXTERNAL'))
        }
      });
    }

    console.log('🔍 [Pappers Proxy] Recherche:', { secteur, region, limite });

    const params = new URLSearchParams({
      api_token: API_TOKEN,
      par_page: Math.min(parseInt(limite), 100),
      page: parseInt(page)
    });

    if (secteur && SECTEUR_TO_NAF[secteur]) {
      params.append('code_naf', SECTEUR_TO_NAF[secteur]);
    }

    if (region && REGIONS_TO_DEPTS[region]) {
      params.append('departement', REGIONS_TO_DEPTS[region]);
    }

    const url = `https://api.pappers.fr/v2/recherche?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    const formatted = {
      total: data.total || 0,
      resultats: (data.resultats || []).map(e => ({
        siren: e.siren,
        siret: e.siege?.siret,
        nom: e.nom_entreprise,
        ville: e.siege?.ville,
        codePostal: e.siege?.code_postal,
        effectif: e.tranche_effectif_salarie || 'Non renseigné',
        dateCreation: e.date_creation,
        ca: e.dernier_ca || null,
        actif: e.statut_rcs === 'Inscrit',
        dirigeants: e.representants?.length || 0,
        capitalSocial: e.capital || null
      })),
      source: 'pappers',
      enriched: true
    };

    console.log('✅ [Pappers Proxy]', formatted.total, 'entreprises trouvées');

    return res.status(200).json(formatted);

  } catch (error) {
    console.error('❌ [Proxy]', error.message);
    return res.status(500).json({ 
      error: error.message,
      source: 'proxy'
    });
  }
}
