import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type CreateArticleInput, type ArticleWithProperties } from '../schema';

export const createArticle = async (input: CreateArticleInput): Promise<ArticleWithProperties> => {
  try {
    // Insert article record
    const articleResult = await db.insert(articlesTable)
      .values({
        title: input.title,
        content: input.content,
        updated_at: new Date() // Set updated_at to current time
      })
      .returning()
      .execute();

    const article = articleResult[0];

    // Insert properties if any provided
    const properties = [];
    if (input.properties && input.properties.length > 0) {
      const propertyValues = input.properties.map(prop => ({
        article_id: article.id,
        property_name: prop.property_name,
        property_value: prop.property_value
      }));

      const propertyResults = await db.insert(articlePropertiesTable)
        .values(propertyValues)
        .returning()
        .execute();

      // Transform properties to match the expected format
      properties.push(...propertyResults.map(prop => ({
        property_name: prop.property_name,
        property_value: prop.property_value
      })));
    }

    return {
      id: article.id,
      title: article.title,
      content: article.content,
      created_at: article.created_at,
      updated_at: article.updated_at,
      properties
    };
  } catch (error) {
    console.error('Article creation failed:', error);
    throw error;
  }
};