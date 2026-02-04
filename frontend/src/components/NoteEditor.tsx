import React, { useState, useEffect } from 'react';
import { Note, NoteFormData } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X, FileText } from 'lucide-react';

interface NoteEditorProps {
  note?: Note;
  onSave: (noteData: NoteFormData) => void;
  onCancel: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel }) => {
  const [formData, setFormData] = useState<NoteFormData>({
    title: note?.title || '',
    content: note?.content || ''
  });

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content
      });
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() || formData.content.trim()) {
      onSave(formData);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSubmit(e as any);
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <Card className="bg-gray-800 border-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white">
              {note ? 'Edit Holocron' : 'Create New Holocron'}
            </CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Holocron Title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-400 focus:ring-orange-400"
              autoFocus
            />
          </div>
          <div>
            <Textarea
              placeholder="Record your thoughts in the Archives..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-400 focus:ring-orange-400 min-h-[300px] resize-none"
              rows={12}
            />
          </div>
          <div className="text-xs text-gray-400">
            Press Ctrl+S to save • Press Escape to cancel
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NoteEditor;