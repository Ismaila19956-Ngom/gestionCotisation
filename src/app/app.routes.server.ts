import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'membres/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'membres/suivi/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'cotisations/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
