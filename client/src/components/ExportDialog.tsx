import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { Download, FileText, File, CheckCircle, AlertCircle } from 'lucide-react';
import type { ArticleWithProperties, ExportFormat } from '../../../server/src/schema';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  articles: ArticleWithProperties[];
}

export function ExportDialog({ isOpen, onClose, articles, }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('html');
  const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string; downloadUrl?: string } | null>(null);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedArticleIds(articles.map((article: ArticleWithProperties) => article.id));
    } else {
      setSelectedArticleIds([]);
    }
  };

  const handleArticleSelection = (articleId: number, checked: boolean) => {
    if (checked) {
      setSelectedArticleIds(prev => [...prev, articleId]);
    } else {
      setSelectedArticleIds(prev => prev.filter(id => id !== articleId));
      setSelectAll(false);
    }
  };

  const handleExport = async () => {
    if (selectedArticleIds.length === 0 && !selectAll) {
      setExportResult({
        success: false,
        message: 'Please select at least one article to export.'
      });
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      const exportInput = {
        format: exportFormat,
        article_ids: selectAll ? undefined : selectedArticleIds,
      };

      await trpc.exportArticles.mutate(exportInput);
      
      // Since this is a stub implementation, we'll simulate a successful export
      setExportResult({
        success: true,
        message: `Successfully exported ${selectAll ? articles.length : selectedArticleIds.length} article(s) as ${exportFormat.toUpperCase()}.`,
        downloadUrl: '#' // In real implementation, this would be the actual download URL
      });

    } catch (error) {
      console.error('Export failed:', error);
      setExportResult({
        success: false,
        message: 'Export failed. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generatePreview = () => {
    const articlesToExport = selectAll ? articles : articles.filter((article: ArticleWithProperties) => 
      selectedArticleIds.includes(article.id)
    );

    if (articlesToExport.length === 0) {
      return '<p>No articles selected for export.</p>';
    }

    // Generate HTML preview
    let html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">📚 Article Documentation</h1>
        
        <div style="margin: 30px 0;">
          <h2 style="color: #374151; margin-bottom: 15px;">📋 Table of Contents</h2>
          <ul style="list-style: none; padding: 0;">
    `;

    // Add TOC links
    articlesToExport.forEach((article: ArticleWithProperties, index: number) => {
      html += `
        <li style="margin-bottom: 8px;">
          <a href="#article-${article.id}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
            ${index + 1}. ${article.title}
          </a>
        </li>
      `;
    });

    html += `
          </ul>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;" />
    `;

    // Add articles content
    articlesToExport.forEach((article: ArticleWithProperties, index: number) => {
      html += `
        <article id="article-${article.id}" style="margin-bottom: 50px;">
          <h2 style="color: #1f2937; border-bottom: 1px solid #d1d5db; padding-bottom: 10px;">
            ${index + 1}. ${article.title}
          </h2>
      `;

      // Add properties if they exist
      if (article.properties.length > 0) {
        html += `
          <div style="background: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #3b82f6;">
            <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">Properties:</h4>
            <ul style="margin: 0; padding: 0; list-style: none;">
        `;
        
        article.properties.forEach((property) => {
          html += `
            <li style="margin-bottom: 5px; font-size: 14px; color: #6b7280;">
              <strong style="color: #374151;">${property.property_name}:</strong> ${property.property_value}
            </li>
          `;
        });

        html += `
            </ul>
          </div>
        `;
      }

      // Add article content
      html += `
          <div style="line-height: 1.6; color: #374151;">
            ${article.content || '<p><em>No content</em></p>'}
          </div>
        </article>
      `;
    });

    html += `
      </div>
    `;

    return html;
  };

  const resetDialog = () => {
    setExportResult(null);
    setSelectAll(true);
    setSelectedArticleIds(articles.map((article: ArticleWithProperties) => article.id));
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <span>📄 Export Articles</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format Selection */}
          <Card>
            <CardContent className="pt-4">
              <Label className="text-base font-medium mb-3 block">Export Format</Label>
              <RadioGroup
                value={exportFormat}
                onValueChange={(value: ExportFormat) => setExportFormat(value)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                  <RadioGroupItem value="html" id="html" />
                  <Label htmlFor="html" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">HTML Document</div>
                      <div className="text-xs text-gray-500">Single HTML file with clickable TOC</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <File className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-medium">PDF Document</div>
                      <div className="text-xs text-gray-500">Formatted PDF with TOC</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Article Selection */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium">Select Articles</Label>
                <Badge variant="secondary">
                  {articles.length} total article{articles.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    Select All Articles
                  </Label>
                </div>

                {!selectAll && (
                  <div className="ml-6 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {articles.map((article: ArticleWithProperties) => (
                      <div key={article.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`article-${article.id}`}
                          checked={selectedArticleIds.includes(article.id)}
                          onCheckedChange={(checked: boolean) => 
                            handleArticleSelection(article.id, checked)
                          }
                        />
                        <Label htmlFor={`article-${article.id}`} className="text-sm flex-1">
                          {article.title}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {article.properties.length} props
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Result */}
          {exportResult && (
            <Card className={exportResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  {exportResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${exportResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {exportResult.message}
                    </p>
                    {exportResult.success && exportResult.downloadUrl && (
                      <p className="text-sm text-green-700 mt-1">
                        📥 Note: This is a demo. In a real application, your download would start automatically.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          <Card>
            <CardContent className="pt-4">
              <Label className="text-base font-medium mb-3 block">Export Preview</Label>
              <div 
                className="border rounded-lg p-4 bg-white max-h-60 overflow-y-auto text-sm"
                dangerouslySetInnerHTML={{ __html: generatePreview() }}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-600">
              {selectAll ? articles.length : selectedArticleIds.length} article{(selectAll ? articles.length : selectedArticleIds.length) !== 1 ? 's' : ''} will be exported as {exportFormat.toUpperCase()}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleClose}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting || (selectedArticleIds.length === 0 && !selectAll)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}