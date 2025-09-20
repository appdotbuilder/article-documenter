import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Articles table
export const articlesTable = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull().default(''), // HTML content from WYSIWYG editor
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Article properties table for custom properties
export const articlePropertiesTable = pgTable('article_properties', {
  id: serial('id').primaryKey(),
  article_id: integer('article_id').notNull().references(() => articlesTable.id, { onDelete: 'cascade' }),
  property_name: text('property_name').notNull(),
  property_value: text('property_value').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const articlesRelations = relations(articlesTable, ({ many }) => ({
  properties: many(articlePropertiesTable),
}));

export const articlePropertiesRelations = relations(articlePropertiesTable, ({ one }) => ({
  article: one(articlesTable, {
    fields: [articlePropertiesTable.article_id],
    references: [articlesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Article = typeof articlesTable.$inferSelect;
export type NewArticle = typeof articlesTable.$inferInsert;
export type ArticleProperty = typeof articlePropertiesTable.$inferSelect;
export type NewArticleProperty = typeof articlePropertiesTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  articles: articlesTable, 
  articleProperties: articlePropertiesTable 
};