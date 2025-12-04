export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { input } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_KEY;

  // 🔍 DEBUG : Vérifier la clé
  console.log('🔑 Clé API chargée:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MANQUANTE');

  if (!input) {
    return res.status(400).json({ error: 'Paramètre "input" manquant' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_KEY non configurée' });
  }

  // ... reste du code identique
