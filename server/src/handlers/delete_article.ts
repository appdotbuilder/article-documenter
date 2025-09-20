import { db } from '../db';
import { articlesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteArticle = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete article by ID from articles table
    // Properties will be automatically deleted via CASCADE constraint
    const result = await db.delete(articlesTable)
      .where(eq(articlesTable.id, id))
      .returning({ id: articlesTable.id })
      .execute();

    // Check if an article was actually deleted
    const success = result.length > 0;
    
    return { success };
  } catch (error) {
    console.error('Article deletion failed:', error);
    throw error;
  }
};