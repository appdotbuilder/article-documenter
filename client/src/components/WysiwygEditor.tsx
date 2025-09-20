import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Quote,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function WysiwygEditor({ value, onChange, placeholder = 'Start writing...' }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isPreview) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isPreview]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const toggleFormat = (command: string) => {
    executeCommand(command);
  };

  // Save selection when editor loses focus
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSelection(sel);
    }
  };

  // Restore selection when using toolbar buttons
  const restoreSelection = () => {
    if (selection && editorRef.current) {
      editorRef.current.focus();
      const newSelection = window.getSelection();
      if (newSelection && selection.rangeCount > 0) {
        newSelection.removeAllRanges();
        newSelection.addRange(selection.getRangeAt(0));
      }
    }
  };

  const isCommandActive = (command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          toggleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          toggleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          toggleFormat('underline');
          break;
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Handle paste to clean up formatting
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2">
        <div className="flex items-center space-x-1 flex-wrap gap-2">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1">
            <Toggle
              pressed={isCommandActive('bold')}
              onPressedChange={() => {
                restoreSelection();
                toggleFormat('bold');
              }}
              size="sm"
              aria-label="Bold"
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={isCommandActive('italic')}
              onPressedChange={() => {
                restoreSelection();
                toggleFormat('italic');
              }}
              size="sm"
              aria-label="Italic"
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={isCommandActive('underline')}
              onPressedChange={() => {
                restoreSelection();
                toggleFormat('underline');
              }}
              size="sm"
              aria-label="Underline"
            >
              <Underline className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                restoreSelection();
                executeCommand('justifyLeft');
              }}
              className="h-8 w-8 p-0"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                restoreSelection();
                executeCommand('justifyCenter');
              }}
              className="h-8 w-8 p-0"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                restoreSelection();
                executeCommand('justifyRight');
              }}
              className="h-8 w-8 p-0"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                restoreSelection();
                executeCommand('insertUnorderedList');
              }}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                restoreSelection();
                executeCommand('insertOrderedList');
              }}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Special Elements */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                restoreSelection();
                insertLink();
              }}
              className="h-8 w-8 p-0"
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                restoreSelection();
                executeCommand('formatBlock', 'blockquote');
              }}
              className="h-8 w-8 p-0"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                restoreSelection();
                executeCommand('formatBlock', 'pre');
              }}
              className="h-8 w-8 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* Preview Toggle */}
          <Toggle
            pressed={isPreview}
            onPressedChange={setIsPreview}
            size="sm"
            aria-label="Toggle Preview"
          >
            {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Toggle>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        {isPreview ? (
          <div
            className="prose prose-sm max-w-none p-4 min-h-[300px] bg-white"
            dangerouslySetInnerHTML={{ __html: value || '<p class="text-gray-400">No content to preview</p>' }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            className="p-4 min-h-[300px] focus:outline-none bg-white"
            onInput={handleInput}
            onBlur={saveSelection}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            style={{ 
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
            data-placeholder={placeholder}
          />
        )}
        
        {/* Placeholder */}
        {!value && !isPreview && (
          <div 
            className="absolute top-4 left-4 text-gray-400 pointer-events-none"
            style={{ 
              display: editorRef.current?.innerText ? 'none' : 'block' 
            }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {isPreview ? 'Preview Mode' : 'Edit Mode'} • 
            Characters: {value.replace(/<[^>]*>/g, '').length}
          </span>
          <span>
            Ctrl+B: Bold • Ctrl+I: Italic • Ctrl+U: Underline
          </span>
        </div>
      </div>
    </div>
  );
}