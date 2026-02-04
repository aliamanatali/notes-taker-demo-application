import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

interface EmptyStateProps {
  onCreateNote: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateNote }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6">
        <FileText className="w-24 h-24 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-2xl font-semibold text-white mb-2">
          Your Archives Are Empty
        </h3>
        <p className="text-gray-400 max-w-md">
          Begin your journey by creating your first Holocron. 
          Record your thoughts, ideas, and knowledge for the galaxy.
        </p>
      </div>
      <Button
        onClick={onCreateNote}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Holocron
      </Button>
    </div>
  );
};

export default EmptyState;