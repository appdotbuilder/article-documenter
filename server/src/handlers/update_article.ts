import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type UpdateArticleInput, type ArticleWithProperties } from '../schema';
import { eq } from 'drizzle-orm';

export const updateArticle = async (input: UpdateArticleInput): Promise<ArticleWithProperties> => {
  try {
    // Build update values object
    const updateValues: any = {
      updated_at: new Date()
    };
    
    if (input.title !== undefined) {
      updateValues.title = input.title;
    }
    
    if (input.content !== undefined) {
      updateValues.content = input.content;
    }

    // Update article
    const result = await db.update(articlesTable)
      .set(updateValues)
      .where(eq(articlesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Article with id ${input.id} not found`);
    }

    const article = result[0];

    // Update properties if provided
    if (input.properties !== undefined) {
      // Delete existing properties
      await db.delete(articlePropertiesTable)
        .where(eq(articlePropertiesTable.article_id, input.id))
        .execute();

      // Insert new properties
      if (input.properties.length > 0) {
        await db.insert(articlePropertiesTable)
          .values(
            input.properties.map(prop => ({
              article_id: input.id,
              property_name: prop.property_name,
              property_value: prop.property_value
            }))
          )
          .execute();
      }
    }

    // Fetch current properties to return
    const currentProperties = await db.select()
      .from(articlePropertiesTable)
      .where(eq(articlePropertiesTable.article_id, input.id))
      .execute();

    return {
      ...article,
      properties: currentProperties.map(prop => ({
        property_name: prop.property_name,
        property_value: prop.property_value
      }))
    };
  } catch (error) {
    console.error('Article update failed:', error);
    throw error;
  }
};