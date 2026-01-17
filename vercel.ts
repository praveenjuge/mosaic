import { routes, type VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  redirects: [routes.redirect('/use', `${process.env.CONVEX_SITE_URL}/use`)]
}
