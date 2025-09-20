import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type ArticleWithProperties } from '../schema';
import { eq } from 'drizzle-orm';

export const getArticles = async (): Promise<ArticleWithProperties[]> => {
  try {
    // Fetch all articles
    const articles = await db.select()
      .from(articlesTable)
      .orderBy(articlesTable.updated_at)
      .execute();

    if (articles.length === 0) {
      return [];
    }

    // Fetch properties for all articles
    const articleIds = articles.map(article => article.id);
    const properties = await db.select()
      .from(articlePropertiesTable)
      .execute();

    // Combine articles with their properties
    return articles.map(article => ({
      ...article,
      properties: properties
        .filter(prop => prop.article_id === article.id)
        .map(prop => ({
          property_name: prop.property_name,
          property_value: prop.property_value
        }))
    }));
  } catch (error) {
    console.error('Get articles failed:', error);
    throw error;
  }
};