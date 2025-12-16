/**
 * Proxy Pappers API - Évite l'exposition de la clé API côté client
 */

const SECTEUR_TO_NAF = {
  // ALIMENTAIRE
  'Restauration': '5610A,5610B,5610C', // Restaurant traditionnel, cafétéria, restauration rapide
  'Boulangerie': '1071C', 
  'Pâtisserie': '1071D',
  'Boucherie': '4722Z,1011Z',
  'Poissonnerie': '4723Z',
  'Traiteur': '5621Z',
  'Bar': '5630Z',
  'Épicerie': '4711B,4711C,4711D',
  
  // SERVICES À LA PERSONNE
  'Coiffure': '9602A,9602B', // Coiffure, autres soins de beauté
  'Esthétique': '9602B',
  'Pressing': '9601B',
  'Réparation chaussures': '9523Z',
  'Cordonnerie': '9523Z',
  
  // COMMERCE
  'Commerce de détail': '4711,4719,4721,4722,4724,4725,4729,4730,4741,4742,4751,4752,4753,4754,4759,4761,4762,4763,4764,4765,4771,4772,4773,4774,4775,4776,4777,4778,4779',
  'Commerce alimentaire': '4711,4721,4722,4723,4724,4725,4729',
  'Pharmacie': '4773Z',
  'Opticien': '4778A',
  'Fleuriste': '4776Z',
  'Librairie': '4761Z',
  'Vêtements': '4771Z,4772A,4772B',
  'Chaussures': '4772A',
  
  // CONSTRUCTION & ARTISANAT
  'Construction': '4120A,4120B,4312A,4321A,4322A,4322B,4329A,4331Z,4332A,4332B,4333Z,4334Z,4339Z,4391A,4391B,4399A,4399B,4399C,4399D',
  'Plomberie': '4322A,4322B',
  'Électricité': '4321A',
  'Menuiserie': '4332A',
  'Peinture': '4334Z',
  'Maçonnerie': '4399C',
  'Couverture': '4391A,4391B',
  
  // SERVICES PROFESSIONNELS
  'Architecture et ingénierie': '7111Z,7112A,7112B', // Archi, ingénierie études techniques
  'Comptabilité': '6920Z',
  'Conseil entreprise': '7022Z',
  'Avocat': '6910Z',
  'Notaire': '6910Z',
  'Graphisme': '7410Z',
  'Communication': '7311Z,7312Z',
  'Traduction': '7430Z',
  
  // SANTÉ
  'Médecin': '8621Z,8622A,8622B,8623Z',
  'Kinésithérapeute': '8690D',
  'Infirmier': '8690D',
  'Dentiste': '8623Z',
  'Pharmacie': '4773Z',
  'Laboratoire analyse': '8690B',
  
  // TRANSPORTS
  'Taxi': '4932Z',
  'VTC': '4932Z',
  'Ambulance': '8690A',
  'Déménagement': '4942Z',
  'Messagerie': '5320Z',
  
  // HÉBERGEMENT & TOURISME
  'Hébergement': '5510Z,5520Z,5530Z', // Hôtels, héberg touristique, camping
  'Hôtel': '5510Z',
  'Gîte': '5520Z',
  'Camping': '5530Z',
  'Agence voyage': '7911Z,7912Z',
  
  // SERVICES TECHNIQUES
  'Réparation auto': '4520A,4520B',
  'Garage': '4520A',
  'Nettoyage': '8121Z,8122Z',
  'Sécurité': '8010Z,8020Z',
  'Entretien espaces verts': '8130Z',
  
  // IMMOBILIER
  'Immobilier': '6810Z,6820A,6820B,6831Z,6832A', // Transaction, location, admin biens
  'Agent immobilier': '6831Z',
  'Syndic': '6832A',
  
  // NUMÉRIQUE
  'Développement web': '6201Z,6202A',
  'Conseil IT': '6202A',
  'Marketing digital': '7311Z,7312Z,7021Z',
  
  // ENSEIGNEMENT
  'Formation': '8559A,8559B',
  'Enseignement': '8520Z,8531Z,8532Z',
  'Auto-école': '8553Z',
  
  // SPORT & LOISIRS
  'Salle de sport': '9311Z,9313Z',
  'Coach sportif': '9313Z',
  'Activités récréatives': '9329Z',
  
  // CULTURE
  'Photographe': '7420Z',
  'Spectacle': '9001Z,9002Z',
  'Galerie art': '4778C',
  
  // LARGE (pour recherches larges)
  'Commerce': '47', // Toute la division commerce de détail
  'Industrie': '10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33',
  'Services': '45,46,47,49,50,51,52,53,55,56,58,59,60,61,62,63,64,65,66,68,69,70,71,72,73,74,75,77,78,79,80,81,82,84,85,86,87,88,90,91,92,93,94,95,96',
  'Artisanat': '10,13,14,15,16,23,25,31,32,33,43,95,96'
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
    // ⭐ CHANGEMENT ICI : ajout de "departement" dans la destruction
    const { secteur, region, departement, limite = 100, page = 1 } = req.query;
    
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

    console.log('🔍 [Pappers Proxy] Recherche:', { secteur, region, departement, limite });

    const params = new URLSearchParams({
      api_token: API_TOKEN,
      par_page: Math.min(parseInt(limite), 100),
      page: parseInt(page)
    });

    if (secteur && SECTEUR_TO_NAF[secteur]) {
      params.append('code_naf', SECTEUR_TO_NAF[secteur]);
    }

    // ⭐ CHANGEMENT ICI : support département OU région
    if (departement) {
      // Si département fourni directement (ex: "33" pour Gironde)
      params.append('departement', departement);
    } else if (region && REGIONS_TO_DEPTS[region]) {
      // Sinon, conversion région → départements (ancien système)
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
        effectif: e.tranche_effectif_salarie?.nom || e.tranche_effectif_salarie || 'Non renseigné',  // ← CORRECTION !
        dateCreation: e.date_creation,
        ca: e.dernier_ca || null,
        actif: e.statut_rcs === 'Inscrit',
        dirigeants: e.representants?.length || 0,
        capitalSocial: e.capital || null
      })),
 // 🐛 DEBUG: Voir ce que Pappers renvoie vraiment
console.log('🐛 [PROXY DEBUG] Premier résultat Pappers brut:', JSON.stringify(data.resultats?.[0], null, 2));
          source: 'pappers',
          enriched: true
        };

  // 🐛 DEBUG: Voir la structure de tranche_effectif_salarie
  if (data.resultats.indexOf(e) === 0) {
    console.log('🐛 [PROXY] tranche_effectif_salarie type:', typeof e.tranche_effectif_salarie);
    console.log('🐛 [PROXY] tranche_effectif_salarie value:', e.tranche_effectif_salarie);
  }
  
  return {
    siren: e.siren,
    siret: e.siege?.siret,
    nom: e.nom_entreprise,
    ville: e.siege?.ville,
    codePostal: e.siege?.code_postal,
    effectif: e.tranche_effectif_salarie?.nom || e.tranche_effectif_salarie || 'Non renseigné',
    dateCreation: e.date_creation,
    ca: e.dernier_ca || null,
    actif: e.statut_rcs === 'Inscrit',
    dirigeants: e.representants?.length || 0,
    capitalSocial: e.capital || null
  };
}),


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
