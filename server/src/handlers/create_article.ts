import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type CreateArticleInput, type ArticleWithProperties } from '../schema';

export const createArticle = async (input: CreateArticleInput): Promise<ArticleWithProperties> => {
  try {
    // Insert article record
    const result = await db.insert(articlesTable)
      .values({
        title: input.title,
        content: input.content,
        updated_at: new Date()
      })
      .returning()
      .execute();

    const article = result[0];

    // Insert properties if any
    if (input.properties && input.properties.length > 0) {
      await db.insert(articlePropertiesTable)
        .values(
          input.properties.map(prop => ({
            article_id: article.id,
            property_name: prop.property_name,
            property_value: prop.property_value
          }))
        )
        .execute();
    }

    // Return article with properties
    return {
      ...article,
      properties: input.properties || []
    };
  } catch (error) {
    console.error('Article creation failed:', error);
    throw error;
  }
};