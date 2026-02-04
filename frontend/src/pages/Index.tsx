import React, { useState, useEffect } from "react";
import { Note, NoteFormData } from "@/types/note";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  ApiNote,
} from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";
import SearchBar from "@/components/SearchBar";
import NoteCard from "@/components/NoteCard";
import NoteEditor from "@/components/NoteEditor";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Archive, Star, FileText, LogOut, User, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper function to convert API note to frontend note
const convertApiNoteToNote = (apiNote: ApiNote): Note => ({
  id: apiNote.id,
  title: apiNote.title,
  content: apiNote.content,
  createdAt: new Date(apiNote.created_at),
  updatedAt: new Date(apiNote.updated_at),
});

const Index: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    noteId: string;
    noteTitle: string;
  }>({
    isOpen: false,
    noteId: "",
    noteTitle: "",
  });

  // Load notes from API
  const loadNotesFromAPI = async (search?: string) => {
    try {
      setIsLoading(true);
      const apiNotes = await getNotes(search);
      const convertedNotes = apiNotes.map(convertApiNoteToNote);
      setNotes(convertedNotes);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to load notes"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load notes on component mount
  useEffect(() => {
    loadNotesFromAPI();
  }, []);

  // Handle search with API call
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadNotesFromAPI(searchTerm || undefined);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCreateNote = () => {
    setIsCreating(true);
    setEditingNote(null);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsCreating(false);
  };

  const handleSaveNote = async (noteData: NoteFormData) => {
    try {
      if (editingNote) {
        // Update existing note
        const updatedApiNote = await updateNote(editingNote.id, noteData);
        const updatedNote = convertApiNoteToNote(updatedApiNote);
        setNotes(
          notes.map((note) => (note.id === editingNote.id ? updatedNote : note))
        );
        showSuccess("Holocron updated successfully!");
      } else {
        // Create new note
        const newApiNote = await createNote(noteData);
        const newNote = convertApiNoteToNote(newApiNote);
        setNotes([newNote, ...notes]);
        showSuccess("New Holocron created successfully!");
      }

      setEditingNote(null);
      setIsCreating(false);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to save Holocron. Please try again."
      );
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = notes.find((note) => note.id === noteId);
    if (noteToDelete) {
      setDeleteConfirm({
        isOpen: true,
        noteId,
        noteTitle: noteToDelete.title || "Untitled Holocron",
      });
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteNote(deleteConfirm.noteId);
      setNotes(notes.filter((note) => note.id !== deleteConfirm.noteId));
      showSuccess("Holocron deleted successfully!");
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to delete Holocron. Please try again."
      );
    } finally {
      setDeleteConfirm({ isOpen: false, noteId: "", noteTitle: "" });
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setIsCreating(false);
  };

  const handleLogout = () => {
    logout();
    showSuccess("Logged out successfully");
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <User className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-blue-300">{user?.email}</span>
            </div>
            <div className="flex items-center">
              <Archive className="w-8 h-8 text-blue-400 mr-3" />
              <h1 className="text-4xl font-bold text-white">
                Galactic Archives
              </h1>
              <Star className="w-6 h-6 text-orange-400 ml-3" />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/pricing")}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pricing
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <p className="text-blue-300 text-lg">
            Your personal collection of Holocrons from across the galaxy
          </p>
        </div>

        {/* Action Bar */}
        {!isCreating && !editingNote && (
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-md">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>
            <Button
              onClick={handleCreateNote}
              className="bg-blue-600 hover:bg-blue-700 text-white ml-0 sm:ml-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Holocron
            </Button>
          </div>
        )}

        {/* Main Content */}
        {isCreating || editingNote ? (
          <NoteEditor
            note={editingNote || undefined}
            onSave={handleSaveNote}
            onCancel={handleCancelEdit}
          />
        ) : isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-blue-300">Loading your Holocrons...</p>
          </div>
        ) : (
          <>
            {notes.length === 0 && !searchTerm ? (
              <EmptyState onCreateNote={handleCreateNote} />
            ) : notes.length === 0 && searchTerm ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl text-white mb-2">No Holocrons Found</h3>
                <p className="text-gray-400">
                  Try adjusting your search terms to find what you're looking
                  for.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-blue-300">
                  {sortedNotes.length} Holocron
                  {sortedNotes.length !== 1 ? "s" : ""} found
                  {searchTerm && ` for "${searchTerm}"`}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={handleEditNote}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() =>
            setDeleteConfirm({ isOpen: false, noteId: "", noteTitle: "" })
          }
          onConfirm={confirmDelete}
          title="Delete Holocron"
          description={`Are you sure you want to delete "${deleteConfirm.noteTitle}"? This action cannot be undone and the Holocron will be lost to the void.`}
        />
      </div>
    </div>
  );
};

export default Index;
