import React from 'react';
import { Note } from '@/types/note';
import { formatRelativeTime } from '@/utils/dateFormat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FileText } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete }) => {
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card className="bg-gray-800 border-blue-500 hover:border-orange-400 transition-colors duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white text-lg font-semibold truncate">
              {note.title || 'Untitled Holocron'}
            </CardTitle>
          </div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(note)}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(note.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 text-sm mb-3 leading-relaxed">
          {truncateContent(note.content)}
        </p>
        <div className="text-xs text-blue-400">
          {formatRelativeTime(note.updatedAt)}
        </div>
      </CardContent>
    </Card>
  );
};

export default NoteCard;