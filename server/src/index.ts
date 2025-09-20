import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createArticleInputSchema, 
  updateArticleInputSchema, 
  exportInputSchema 
} from './schema';

// Import handlers
import { createArticle } from './handlers/create_article';
import { getArticles } from './handlers/get_articles';
import { getArticleById } from './handlers/get_article_by_id';
import { updateArticle } from './handlers/update_article';
import { deleteArticle } from './handlers/delete_article';
import { exportArticles } from './handlers/export_articles';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Article management endpoints
  createArticle: publicProcedure
    .input(createArticleInputSchema)
    .mutation(({ input }) => createArticle(input)),

  getArticles: publicProcedure
    .query(() => getArticles()),

  getArticleById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getArticleById(input.id)),

  updateArticle: publicProcedure
    .input(updateArticleInputSchema)
    .mutation(({ input }) => updateArticle(input)),

  deleteArticle: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteArticle(input.id)),

  // Export functionality
  exportArticles: publicProcedure
    .input(exportInputSchema)
    .mutation(({ input }) => exportArticles(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();