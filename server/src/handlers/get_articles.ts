import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type ArticleWithProperties } from '../schema';
import { eq } from 'drizzle-orm';

export const getArticles = async (): Promise<ArticleWithProperties[]> => {
  try {
    // Query all articles with their properties using drizzle relations
    const results = await db
      .select({
        // Article fields
        id: articlesTable.id,
        title: articlesTable.title,
        content: articlesTable.content,
        created_at: articlesTable.created_at,
        updated_at: articlesTable.updated_at,
        // Property fields (will be null if no properties exist)
        property_id: articlePropertiesTable.id,
        property_name: articlePropertiesTable.property_name,
        property_value: articlePropertiesTable.property_value,
      })
      .from(articlesTable)
      .leftJoin(
        articlePropertiesTable,
        eq(articlesTable.id, articlePropertiesTable.article_id)
      )
      .execute();

    // Group the results by article ID to combine properties
    const articlesMap = new Map<number, ArticleWithProperties>();

    results.forEach((row) => {
      const articleId = row.id;
      
      if (!articlesMap.has(articleId)) {
        // Create new article entry
        articlesMap.set(articleId, {
          id: row.id,
          title: row.title,
          content: row.content,
          created_at: row.created_at,
          updated_at: row.updated_at,
          properties: [],
        });
      }

      // Add property if it exists
      if (row.property_id && row.property_name && row.property_value !== null) {
        const article = articlesMap.get(articleId)!;
        article.properties.push({
          property_name: row.property_name,
          property_value: row.property_value,
        });
      }
    });

    // Convert map to array and return
    return Array.from(articlesMap.values());
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    throw error;
  }
};