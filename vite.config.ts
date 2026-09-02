import path from 'node:path'
import fs from 'node:fs'
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

interface VercelStyleResponse {
  status: (code: number) => VercelStyleResponse
  json: (data: unknown) => void
}

/**
 * `npm run dev` es Vite puro: no sabe nada de `api/*.ts` (eso solo lo
 * entiende Vercel al desplegar). Sin esto, cualquier fetch a /api/algo en
 * local devuelve 404. Este middleware reproduce el runtime de una función
 * de Vercel (body parseado + res.status().json()) para que /api/* funcione
 * igual en dev que en producción.
 */
function vercelApiDevPlugin(): Plugin {
  return {
    name: 'vercel-api-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      // @supabase/supabase-js arma su cliente de realtime al crear el
      // cliente (createClient), aunque la función nunca lo use, y eso
      // revienta en Node 20 por no traer WebSocket nativo (llegó recién en
      // Node 22). En Vercel esto no pasa (su runtime ya lo trae); este stub
      // es solo para que las funciones de api/ tampoco truenen en dev local.
      if (typeof globalThis.WebSocket === 'undefined') {
        // @ts-expect-error stub mínimo, ninguna función de api/ usa realtime
        globalThis.WebSocket = class {}
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.method || !req.url.startsWith('/api/')) {
          next()
          return
        }

        const routeName = req.url.split('?')[0].replace(/^\/api\//, '')
        const filePath = path.resolve(import.meta.dirname, 'api', `${routeName}.ts`)
        if (!routeName || !fs.existsSync(filePath)) {
          next()
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const raw = Buffer.concat(chunks).toString('utf-8')

          let body: unknown
          const contentType = String(req.headers['content-type'] ?? '')
          if (raw && contentType.includes('application/json')) {
            try {
              body = JSON.parse(raw)
            } catch {
              body = undefined
            }
          }
          ;(req as typeof req & { body?: unknown }).body = body

          const vercelRes = res as typeof res & VercelStyleResponse
          vercelRes.status = (code: number) => {
            res.statusCode = code
            return vercelRes
          }
          vercelRes.json = (data: unknown) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          }

          const mod = await server.ssrLoadModule(filePath)
          await mod.default(req, vercelRes)
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite solo mete al process.env del cliente las vars con prefijo VITE_.
  // Las funciones de api/ (como Vercel) esperan TODAS las vars de .env.local
  // en process.env (p.ej. GROQ_API_KEY), así que las copiamos a mano para
  // que el middleware de dev de arriba pueda leerlas.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), tailwindcss(), vercelApiDevPlugin()],
  }
})
