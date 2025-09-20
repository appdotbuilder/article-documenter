import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { ArticleEditor } from '@/components/ArticleEditor';
import { TableOfContents } from '@/components/TableOfContents';
import { ExportDialog } from '@/components/ExportDialog';
import { Plus, FileText, Download } from 'lucide-react';
import type { ArticleWithProperties } from '../../server/src/schema';

function App() {
  const [articles, setArticles] = useState<ArticleWithProperties[]>([]);
  const [activeTab, setActiveTab] = useState<string>('toc');
  const [editingArticle, setEditingArticle] = useState<ArticleWithProperties | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getArticles.query();
      setArticles(result);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleCreateArticle = () => {
    setEditingArticle(null);
    setActiveTab('editor');
  };

  const handleEditArticle = (article: ArticleWithProperties) => {
    setEditingArticle(article);
    setActiveTab('editor');
  };

  const handleArticleSaved = async () => {
    await loadArticles(); // Refresh the list
    setActiveTab('toc'); // Return to TOC
  };

  const handleDeleteArticle = async (id: number) => {
    try {
      await trpc.deleteArticle.mutate({ id });
      await loadArticles(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">📚 Article Documentation</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleCreateArticle}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </Button>
              <Button
                onClick={() => setIsExportDialogOpen(true)}
                variant="outline"
                className="border-gray-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
            <TabsTrigger value="toc" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Table of Contents</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Article Editor</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="toc" className="mt-0">
            <TableOfContents
              articles={articles}
              isLoading={isLoading}
              onEditArticle={handleEditArticle}
              onDeleteArticle={handleDeleteArticle}
            />
          </TabsContent>

          <TabsContent value="editor" className="mt-0">
            <ArticleEditor
              article={editingArticle}
              onSave={handleArticleSaved}
              onCancel={() => setActiveTab('toc')}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        articles={articles}
      />
    </div>
  );
}

export default App;