import { z } from 'zod';

// Article schema for database operations
export const articleSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(), // HTML content from WYSIWYG editor
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Article = z.infer<typeof articleSchema>;

// Article property schema for custom properties
export const articlePropertySchema = z.object({
  id: z.number(),
  article_id: z.number(),
  property_name: z.string(),
  property_value: z.string(),
  created_at: z.coerce.date(),
});

export type ArticleProperty = z.infer<typeof articlePropertySchema>;

// Input schema for creating articles
export const createArticleInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().default(""), // HTML content, can start empty
  properties: z.array(z.object({
    property_name: z.string().min(1, "Property name is required"),
    property_value: z.string(),
  })).default([]), // Array of custom properties
});

export type CreateArticleInput = z.infer<typeof createArticleInputSchema>;

// Input schema for updating articles
export const updateArticleInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().optional(), // HTML content
  properties: z.array(z.object({
    property_name: z.string().min(1, "Property name is required"),
    property_value: z.string(),
  })).optional(), // Updated properties array
});

export type UpdateArticleInput = z.infer<typeof updateArticleInputSchema>;

// Response schema for articles with properties
export const articleWithPropertiesSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  properties: z.array(z.object({
    property_name: z.string(),
    property_value: z.string(),
  })),
});

export type ArticleWithProperties = z.infer<typeof articleWithPropertiesSchema>;

// Export format schema
export const exportFormatSchema = z.enum(['html', 'pdf']);

export type ExportFormat = z.infer<typeof exportFormatSchema>;

// Export input schema
export const exportInputSchema = z.object({
  format: exportFormatSchema,
  article_ids: z.array(z.number()).optional(), // If not provided, export all articles
});

export type ExportInput = z.infer<typeof exportInputSchema>;