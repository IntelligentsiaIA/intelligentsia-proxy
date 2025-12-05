// api/sirene-stats.js (Vercel proxy)
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { q, secteur, region, limit = 10, page = 1 } = req.query;
  const url = new URL('https://recherche-entreprises.api.gouv.fr/search');
  if (q) url.searchParams.append('q', q);
  if (secteur) url.searchParams.append('activite', secteur); // Mapping INSEE vers mots-clés
  if (region) url.searchParams.append('departement', region); // Filtre géo (région → dépt principal ou liste)
  url.searchParams.append('nombre', limit.toString());
  url.searchParams.append('page', page.toString());

  try {
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    res.status(200).json({
      total: data.total ?? 0,
      entreprises: data.entreprises ?? [],
      // Stats sectorielles agrégées (exemple simple, à enrichir frontend)
      stats: {
        parSecteur: data.entreprises?.reduce((acc, ent) => {
          acc[ent.secteur] = (acc[ent.secteur] || 0) + 1;
          return acc;
        }, {}),
        parRegion: data.entreprises?.reduce((acc, ent) => {
          acc[ent.region] = (acc[ent.region] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
