import type { VercelRequest, VercelResponse } from '@vercel/node'

// Dioses de SMITE 2 (nombre -> id). Se mantienen EMBEBIDOS aquí a propósito:
// las funciones serverless de /api/ de Vercel se compilan de forma aislada y
// no resuelven bien imports cruzados con el bundle del cliente (../src/lib,
// que trae a su vez types + gods.json). Eso hacía explotar el endpoint en
// producción con un 500 sin mensaje, aunque en dev local (Vite) sí cargara.
const GODS: { id: string; name: string }[] = [
  { id: 'Achilles', name: 'Achilles' },
  { id: 'Agni', name: 'Agni' },
  { id: 'AhPuch', name: 'Ah Puch' },
  { id: 'Aladdin', name: 'Aladdin' },
  { id: 'Amaterasu', name: 'Amaterasu' },
  { id: 'Anhur', name: 'Anhur' },
  { id: 'Anubis', name: 'Anubis' },
  { id: 'Aphrodite', name: 'Aphrodite' },
  { id: 'Apollo', name: 'Apollo' },
  { id: 'Ares', name: 'Ares' },
  { id: 'Artemis', name: 'Artemis' },
  { id: 'Artio', name: 'Artio' },
  { id: 'Athena', name: 'Athena' },
  { id: 'Atlas', name: 'Atlas' },
  { id: 'Awilix', name: 'Awilix' },
  { id: 'Bacchus', name: 'Bacchus' },
  { id: 'BaronSamedi', name: 'Baron Samedi' },
  { id: 'Bastet', name: 'Bastet' },
  { id: 'Bellona', name: 'Bellona' },
  { id: 'Cabrakan', name: 'Cabrakan' },
  { id: 'Cerberus', name: 'Cerberus' },
  { id: 'Cernunnos', name: 'Cernunnos' },
  { id: 'Chaac', name: 'Chaac' },
  { id: 'Charon', name: 'Charon' },
  { id: 'Chiron', name: 'Chiron' },
  { id: 'Chronos', name: 'Chronos' },
  { id: 'CuChulainn', name: 'Cu Chulainn' },
  { id: 'Cupid', name: 'Cupid' },
  { id: 'DaJi', name: 'Da Ji' },
  { id: 'Danzaburou', name: 'Danzaburou' },
  { id: 'Discordia', name: 'Discordia' },
  { id: 'Eset', name: 'Eset' },
  { id: 'Fenrir', name: 'Fenrir' },
  { id: 'Ganesha', name: 'Ganesha' },
  { id: 'Geb', name: 'Geb' },
  { id: 'Gilgamesh', name: 'Gilgamesh' },
  { id: 'GuanYu', name: 'Guan Yu' },
  { id: 'Hades', name: 'Hades' },
  { id: 'Hecate', name: 'Hecate' },
  { id: 'Hercules', name: 'Hercules' },
  { id: 'Horus', name: 'Horus' },
  { id: 'HouYi', name: 'Hou Yi' },
  { id: 'Mulan', name: 'Hua Mulan' },
  { id: 'HunBatz', name: 'Hun Batz' },
  { id: 'Ishtar', name: 'Ishtar' },
  { id: 'IxChel', name: 'Ix Chel' },
  { id: 'Izanami', name: 'Izanami' },
  { id: 'Janus', name: 'Janus' },
  { id: 'JingWei', name: 'Jing Wei' },
  { id: 'Jormungandr', name: 'Jormungandr' },
  { id: 'Kali', name: 'Kali' },
  { id: 'Khepri', name: 'Khepri' },
  { id: 'Kukulkan', name: 'Kukulkan' },
  { id: 'Loki', name: 'Loki' },
  { id: 'Medusa', name: 'Medusa' },
  { id: 'Mercury', name: 'Mercury' },
  { id: 'Merlin', name: 'Merlin' },
  { id: 'Mordred', name: 'Mordred' },
  { id: 'MorganLeFay', name: 'Morgan Le Fay' },
  { id: 'NeZha', name: 'Ne Zha' },
  { id: 'Neith', name: 'Neith' },
  { id: 'Nemesis', name: 'Nemesis' },
  { id: 'NuWa', name: 'Nu Wa' },
  { id: 'Nut', name: 'Nut' },
  { id: 'Odin', name: 'Odin' },
  { id: 'Osiris', name: 'Osiris' },
  { id: 'Pele', name: 'Pele' },
  { id: 'Poseidon', name: 'Poseidon' },
  { id: 'Bari', name: 'Princess Bari' },
  { id: 'Ra', name: 'Ra' },
  { id: 'Rama', name: 'Rama' },
  { id: 'Ratatoskr', name: 'Ratatoskr' },
  { id: 'Scylla', name: 'Scylla' },
  { id: 'Sobek', name: 'Sobek' },
  { id: 'Sol', name: 'Sol' },
  { id: 'SunWukong', name: 'Sun Wukong' },
  { id: 'Susano', name: 'Susano' },
  { id: 'Sylvanus', name: 'Sylvanus' },
  { id: 'Thanatos', name: 'Thanatos' },
  { id: 'TheMorrigan', name: 'The Morrigan' },
  { id: 'Thor', name: 'Thor' },
  { id: 'Tsukuyomi', name: 'Tsukuyomi' },
  { id: 'Ullr', name: 'Ullr' },
  { id: 'Vulcan', name: 'Vulcan' },
  { id: 'Xbalanque', name: 'Xbalanque' },
  { id: 'XingTian', name: 'Xing Tian' },
  { id: 'Yemoja', name: 'Yemoja' },
  { id: 'Ymir', name: 'Ymir' },
  { id: 'Zeus', name: 'Zeus' },
]

const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'

/** minúsculas + sin acentos, para emparejar nombres ignorando tildes. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Reconoce dioses de SMITE 2 en una foto usando un modelo de visión gratuito
 * de Groq. La API key vive solo en el servidor (nunca en el bundle del
 * cliente) porque este endpoint hace la llamada por nosotros.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Falta configurar GROQ_API_KEY en el servidor.' })
    return
  }

  const { image } = (req.body ?? {}) as { image?: unknown }
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    res.status(400).json({ error: 'Imagen inválida.' })
    return
  }

  const godNames = GODS.map((g) => g.name)

  const prompt = `Eres un experto en el videojuego SMITE 2. Te voy a mostrar una captura de pantalla del juego (puede ser selección de dioses, loadout, scoreboard de fin de partida, etc).

Identifica todos los dioses de SMITE 2 que aparezcan claramente en la imagen, ya sea por su retrato/ícono o por su nombre en pantalla.

Solo puedes usar nombres EXACTOS de esta lista, sin inventar ni traducir otros nombres: ${JSON.stringify(godNames)}

Responde ÚNICAMENTE con un JSON de la forma {"gods": ["Nombre1", "Nombre2"]}, sin texto adicional. Si no reconoces con seguridad a ningún dios de la lista, responde {"gods": []}.`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    })
    clearTimeout(timeout)

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '')

      // 429 en Groq cubre tanto "muchas requests seguidas" como "se acabó
      // la cuota gratis del día": para el usuario final el mensaje útil es
      // el mismo, que siga a mano mientras se libera/renueva.
      if (groqRes.status === 429) {
        res.status(429).json({
          error: 'Se agotó la cuota gratuita de reconocimiento por ahora. Selecciona los dioses a mano, o vuelve a intentar en un rato.',
        })
        return
      }

      if (groqRes.status === 401 || groqRes.status === 403) {
        res.status(502).json({
          error: 'El reconocimiento automático no está disponible ahora mismo. Selecciona los dioses a mano.',
        })
        return
      }

      res.status(502).json({
        error: `El servicio de reconocimiento respondió con error (${groqRes.status}). Selecciona los dioses a mano.`,
        detail: errText.slice(0, 500),
      })
      return
    }

    const data: any = await groqRes.json()
    const content: string = data?.choices?.[0]?.message?.content ?? '{}'

    let parsedNames: string[] = []
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed?.gods)) {
        parsedNames = parsed.gods.filter((n: unknown): n is string => typeof n === 'string')
      }
    } catch {
      parsedNames = []
    }

    const byNormalizedName = new Map(GODS.map((g) => [normalize(g.name), g.id]))
    const godIds = Array.from(
      new Set(
        parsedNames
          .map((name) => byNormalizedName.get(normalize(name)))
          .filter((id): id is string => Boolean(id)),
      ),
    )

    res.status(200).json({ godIds })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      res.status(504).json({ error: 'El reconocimiento tardó demasiado. Selecciona los dioses a mano.' })
      return
    }
    res.status(500).json({
      error: 'Error inesperado reconociendo dioses. Selecciona los dioses a mano.',
    })
  } finally {
    clearTimeout(timeout)
  }
}
