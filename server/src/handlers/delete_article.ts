import { db } from '../db';
import { articlesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteArticle = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete article (properties will be deleted via cascade)
    const result = await db.delete(articlesTable)
      .where(eq(articlesTable.id, id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Article deletion failed:', error);
    throw error;
  }
};