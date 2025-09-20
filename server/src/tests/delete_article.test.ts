import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { deleteArticle } from '../handlers/delete_article';
import { eq } from 'drizzle-orm';

describe('deleteArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an article successfully', async () => {
    // Create test article
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Test Article',
        content: '<p>Test content</p>',
      })
      .returning({ id: articlesTable.id })
      .execute();

    const articleId = articleResult[0].id;

    // Delete the article
    const result = await deleteArticle(articleId);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify article no longer exists in database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, articleId))
      .execute();

    expect(articles).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent article', async () => {
    // Try to delete an article that doesn't exist
    const result = await deleteArticle(999);

    // Should return success: false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should cascade delete article properties', async () => {
    // Create test article
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Test Article with Properties',
        content: '<p>Test content</p>',
      })
      .returning({ id: articlesTable.id })
      .execute();

    const articleId = articleResult[0].id;

    // Create test properties for the article
    await db.insert(articlePropertiesTable)
      .values([
        {
          article_id: articleId,
          property_name: 'author',
          property_value: 'John Doe',
        },
        {
          article_id: articleId,
          property_name: 'category',
          property_value: 'Technology',
        },
      ])
      .execute();

    // Verify properties exist before deletion
    const propertiesBefore = await db.select()
      .from(articlePropertiesTable)
      .where(eq(articlePropertiesTable.article_id, articleId))
      .execute();

    expect(propertiesBefore).toHaveLength(2);

    // Delete the article
    const result = await deleteArticle(articleId);

    expect(result.success).toBe(true);

    // Verify article is deleted
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, articleId))
      .execute();

    expect(articles).toHaveLength(0);

    // Verify properties are also deleted due to CASCADE
    const propertiesAfter = await db.select()
      .from(articlePropertiesTable)
      .where(eq(articlePropertiesTable.article_id, articleId))
      .execute();

    expect(propertiesAfter).toHaveLength(0);
  });

  it('should not affect other articles when deleting one article', async () => {
    // Create multiple test articles
    const articleResults = await db.insert(articlesTable)
      .values([
        {
          title: 'Article 1',
          content: '<p>Content 1</p>',
        },
        {
          title: 'Article 2',
          content: '<p>Content 2</p>',
        },
        {
          title: 'Article 3',
          content: '<p>Content 3</p>',
        },
      ])
      .returning({ id: articlesTable.id })
      .execute();

    const [article1, article2, article3] = articleResults;

    // Add properties to different articles
    await db.insert(articlePropertiesTable)
      .values([
        {
          article_id: article1.id,
          property_name: 'author',
          property_value: 'Author 1',
        },
        {
          article_id: article2.id,
          property_name: 'author',
          property_value: 'Author 2',
        },
        {
          article_id: article3.id,
          property_name: 'author',
          property_value: 'Author 3',
        },
      ])
      .execute();

    // Delete only the second article
    const result = await deleteArticle(article2.id);

    expect(result.success).toBe(true);

    // Verify only article2 is deleted
    const remainingArticles = await db.select()
      .from(articlesTable)
      .execute();

    expect(remainingArticles).toHaveLength(2);
    expect(remainingArticles.map(a => a.id)).not.toContain(article2.id);
    expect(remainingArticles.map(a => a.id)).toContain(article1.id);
    expect(remainingArticles.map(a => a.id)).toContain(article3.id);

    // Verify properties of other articles remain intact
    const remainingProperties = await db.select()
      .from(articlePropertiesTable)
      .execute();

    expect(remainingProperties).toHaveLength(2);
    expect(remainingProperties.map(p => p.article_id)).not.toContain(article2.id);
    expect(remainingProperties.map(p => p.article_id)).toContain(article1.id);
    expect(remainingProperties.map(p => p.article_id)).toContain(article3.id);
  });
});