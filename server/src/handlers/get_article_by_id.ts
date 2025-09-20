import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type ArticleWithProperties } from '../schema';
import { eq } from 'drizzle-orm';

export const getArticleById = async (id: number): Promise<ArticleWithProperties | null> => {
  try {
    // Fetch article
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, id))
      .execute();

    if (articles.length === 0) {
      return null;
    }

    const article = articles[0];

    // Fetch properties for the article
    const properties = await db.select()
      .from(articlePropertiesTable)
      .where(eq(articlePropertiesTable.article_id, id))
      .execute();

    return {
      ...article,
      properties: properties.map(prop => ({
        property_name: prop.property_name,
        property_value: prop.property_value
      }))
    };
  } catch (error) {
    console.error('Get article by ID failed:', error);
    throw error;
  }
};