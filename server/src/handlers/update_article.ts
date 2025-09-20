import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type UpdateArticleInput, type ArticleWithProperties } from '../schema';
import { eq } from 'drizzle-orm';

export const updateArticle = async (input: UpdateArticleInput): Promise<ArticleWithProperties> => {
  try {
    // Check if article exists
    const existingArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, input.id))
      .execute();

    if (existingArticle.length === 0) {
      throw new Error(`Article with id ${input.id} not found`);
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    // Update article
    const updatedArticles = await db.update(articlesTable)
      .set(updateData)
      .where(eq(articlesTable.id, input.id))
      .returning()
      .execute();

    const updatedArticle = updatedArticles[0];

    // Handle properties update if provided
    if (input.properties !== undefined) {
      // Delete existing properties for this article
      await db.delete(articlePropertiesTable)
        .where(eq(articlePropertiesTable.article_id, input.id))
        .execute();

      // Insert new properties if any
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

    // Fetch the updated article with its properties
    const articleWithProperties = await db.select({
      id: articlesTable.id,
      title: articlesTable.title,
      content: articlesTable.content,
      created_at: articlesTable.created_at,
      updated_at: articlesTable.updated_at,
      property_name: articlePropertiesTable.property_name,
      property_value: articlePropertiesTable.property_value
    })
      .from(articlesTable)
      .leftJoin(articlePropertiesTable, eq(articlesTable.id, articlePropertiesTable.article_id))
      .where(eq(articlesTable.id, input.id))
      .execute();

    // Group properties
    const properties = articleWithProperties
      .filter(row => row.property_name !== null)
      .map(row => ({
        property_name: row.property_name!,
        property_value: row.property_value!
      }));

    return {
      id: updatedArticle.id,
      title: updatedArticle.title,
      content: updatedArticle.content,
      created_at: updatedArticle.created_at,
      updated_at: updatedArticle.updated_at,
      properties
    };
  } catch (error) {
    console.error('Article update failed:', error);
    throw error;
  }
};