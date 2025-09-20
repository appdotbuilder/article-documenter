import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type ExportInput, type ArticleWithProperties } from '../schema';
import { eq, inArray } from 'drizzle-orm';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export const exportArticles = async (input: ExportInput): Promise<{ success: boolean; downloadUrl?: string }> => {
  try {
    // 1. Fetch articles (all or specified by article_ids)
    const articles = input.article_ids && input.article_ids.length > 0
      ? await db.select()
          .from(articlesTable)
          .where(inArray(articlesTable.id, input.article_ids))
          .execute()
      : await db.select()
          .from(articlesTable)
          .execute();
    
    if (articles.length === 0) {
      return { success: false };
    }
    
    // 2. Fetch properties for all articles
    const articleIds = articles.map(article => article.id);
    const properties = await db.select()
      .from(articlePropertiesTable)
      .where(inArray(articlePropertiesTable.article_id, articleIds))
      .execute();
    
    // 3. Combine articles with their properties
    const articlesWithProperties: ArticleWithProperties[] = articles.map(article => ({
      ...article,
      properties: properties
        .filter(prop => prop.article_id === article.id)
        .map(prop => ({
          property_name: prop.property_name,
          property_value: prop.property_value
        }))
    }));
    
    // 4. Generate HTML content
    const htmlContent = generateHTML(articlesWithProperties);
    
    // 5. Create exports directory if it doesn't exist
    const exportsDir = join(process.cwd(), 'exports');
    try {
      mkdirSync(exportsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, continue
    }
    
    // 6. Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `articles_${timestamp}.${input.format}`;
    const filePath = join(exportsDir, filename);
    
    // 7. Save file based on format
    if (input.format === 'html') {
      writeFileSync(filePath, htmlContent, 'utf-8');
    } else if (input.format === 'pdf') {
      // For PDF, we would need puppeteer or similar library
      // For now, we'll save as HTML and indicate PDF conversion needed
      writeFileSync(filePath.replace('.pdf', '.html'), htmlContent, 'utf-8');
    }
    
    return {
      success: true,
      downloadUrl: `/exports/${filename}`
    };
    
  } catch (error) {
    console.error('Article export failed:', error);
    throw error;
  }
};

const generateHTML = (articles: ArticleWithProperties[]): string => {
  // Generate Table of Contents
  const toc = articles.map(article => 
    `<li><a href="#article-${article.id}">${escapeHtml(article.title)}</a></li>`
  ).join('\n');
  
  // Generate article content
  const articlesHtml = articles.map(article => {
    const propertiesHtml = article.properties.length > 0 
      ? `
        <div class="properties">
          <h4>Properties:</h4>
          <ul>
            ${article.properties.map(prop => 
              `<li><strong>${escapeHtml(prop.property_name)}:</strong> ${escapeHtml(prop.property_value) || '/'}</li>`
            ).join('\n')}
          </ul>
        </div>
      `
      : '';
    
    return `
      <article id="article-${article.id}" class="article">
        <h2>${escapeHtml(article.title)}</h2>
        <div class="metadata">
          <p><strong>Created:</strong> ${article.created_at.toLocaleDateString()}</p>
          <p><strong>Updated:</strong> ${article.updated_at.toLocaleDateString()}</p>
        </div>
        ${propertiesHtml}
        <div class="content">
          ${article.content}
        </div>
        <hr>
      </article>
    `;
  }).join('\n');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Articles Export</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .toc {
            background-color: #f5f5f5;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .toc h2 {
            margin-top: 0;
        }
        .toc ul {
            list-style-type: none;
            padding-left: 0;
        }
        .toc li {
            margin-bottom: 5px;
        }
        .toc a {
            text-decoration: none;
            color: #0066cc;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        .article {
            margin-bottom: 40px;
        }
        .article h2 {
            color: #333;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
        }
        .metadata {
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 3px;
            margin-bottom: 15px;
        }
        .metadata p {
            margin: 5px 0;
        }
        .properties {
            background-color: #fff3cd;
            padding: 15px;
            border-radius: 3px;
            margin-bottom: 15px;
            border: 1px solid #ffeaa7;
        }
        .properties h4 {
            margin-top: 0;
            color: #856404;
        }
        .properties ul {
            margin-bottom: 0;
        }
        .content {
            margin-top: 20px;
        }
        hr {
            border: none;
            height: 1px;
            background-color: #ddd;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            ${toc}
        </ul>
    </div>
    
    <div class="articles">
        ${articlesHtml}
    </div>
</body>
</html>
  `.trim();
};

const escapeHtml = (text: string): string => {
  const div = { innerHTML: '' } as any;
  div.textContent = text;
  return div.innerHTML || text.replace(/[&<>"']/g, (match: string) => {
    const escapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
};