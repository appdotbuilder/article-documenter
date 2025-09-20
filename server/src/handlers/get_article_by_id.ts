import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type ArticleWithProperties } from '../schema';
import { eq } from 'drizzle-orm';

export const getArticleById = async (id: number): Promise<ArticleWithProperties | null> => {
  try {
    // Query article with its properties using a join
    const results = await db.select()
      .from(articlesTable)
      .leftJoin(articlePropertiesTable, eq(articlePropertiesTable.article_id, articlesTable.id))
      .where(eq(articlesTable.id, id))
      .execute();

    // If no results, article doesn't exist
    if (results.length === 0) {
      return null;
    }

    // Transform the joined results into ArticleWithProperties format
    const article = results[0].articles;
    
    // Collect all properties, filtering out null properties (from left join)
    const properties = results
      .filter(result => result.article_properties !== null)
      .map(result => ({
        property_name: result.article_properties!.property_name,
        property_value: result.article_properties!.property_value,
      }));

    return {
      id: article.id,
      title: article.title,
      content: article.content,
      created_at: article.created_at,
      updated_at: article.updated_at,
      properties: properties,
    };
  } catch (error) {
    console.error('Get article by ID failed:', error);
    throw error;
  }
};