/**
 * Proxy Pappers API - Évite l'exposition de la clé API côté client
 */

// Mapping secteurs → codes NAF
const SECTEUR_TO_NAF = {
  'Restauration': '56.10',
  'Boulangerie': '10.71',
  'Coiffure': '96.02',
  'Commerce': '47',
  'Hébergement': '55',
  'Construction': '41,42,43'
};

// Mapping régions → départements
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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 🐛 DEBUG : Log toutes les variables d'environnement disponibles
  const envKeys = Object.keys(process.env).filter(key => 
    key.includes('PAPPERS') || key.includes('API') || key.includes('KEY')
  );
  console.log('🐛 [DEBUG] Variables env qui contiennent PAPPERS/API/KEY:', envKeys);
  console.log('🐛 [DEBUG] PAPPERS_API_KEY existe ?', !!process.env.PAPPERS_API_KEY);
  console.log('🐛 [DEBUG] Longueur clé:', process.env.PAPPERS_API_KEY?.length || 0);

  try {
    const { secteur, region, limite
