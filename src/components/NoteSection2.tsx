import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import toast from "react-hot-toast";
import { dbOperations } from "../db/database";
import { Plus, Loader2, StickyNote, Lightbulb, CheckSquare, Heart, X, Save } from "lucide-react";
import { NoteCard } from "./NoteCard";

export const NoteSection = ({ contactId }: { contactId: number }) => {
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use Dexie's live query to get real-time updates
  const notes = useLiveQuery(
    () => dbOperations.getContactNotes(contactId),
    [contactId]
  ) || [];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [noteContent]);

  // Quick note templates
  const noteTemplates = [
    {
      icon: <StickyNote className="w-4 h-4" />,
      label: "General Note",
      template: "📝 ",
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
    },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: "Task/Reminder",
      template: "✅ TODO: ",
      color: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
    },
    {
      icon: <Lightbulb className="w-4 h-4" />,
      label: "Idea",
      template: "💡 Idea: ",
      color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: "Personal",
      template: "❤️ ",
      color: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800"
    }
  ];

  const handleSaveNote = async () => {
    if (!noteTitle.trim() && !noteContent.trim()) {
      toast.error("Please enter a title or note content");
      return;
    }

    setIsSaving(true);
    try {
      // Use the provided title or generate one from content
      const finalTitle = noteTitle.trim() || 
        (noteContent.trim().length > 40 
          ? noteContent.trim().substring(0, 40) + '...' 
          : noteContent.trim()) || 'Note';
      
      await dbOperations.addNote({
        contactId,
        title: finalTitle,
        content: noteContent.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      });
      
      setNoteTitle("");
      setNoteContent("");
      setShowForm(false);
      setShowTemplates(false);
      toast.success("Note saved successfully!", { duration: 2000, icon: '📝' });
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error("Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await dbOperations.deleteNote(noteId);
      toast.success("Note removed", { duration: 2000 });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error("Failed to remove note");
    }
  };

  const handleTemplateSelect = (template: string) => {
    setNoteContent(template);
    setShowTemplates(false);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowTemplates(false);
    setNoteTitle("");
    setNoteContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveNote();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="mt-6 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
          {notes.length > 0 && (
            <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
              {notes.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!showForm && notes.length > 0 ? (
            <button
              onClick={() => {
                setShowForm(true);
                setShowTemplates(true);
              }}
              className="btn-primary flex items-center gap-2 text-sm px-3 py-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Note</span>
            </button>
          ) : showForm ? (
            <button
              onClick={handleCancel}
              className="btn-ghost p-2"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {showForm && (
        <div className="card p-4 mb-4 space-y-4">
          {/* Quick Templates */}
          {showTemplates && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Start</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Skip templates
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {noteTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemplateSelect(template.template)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-all hover:scale-105 active:scale-95 ${template.color}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {template.icon}
                      <span className="truncate w-full">{template.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note Input */}
          <div className="space-y-3">
            {/* Title Input */}
            <div className="space-y-2">
              <label htmlFor="note-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Title <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="note-title"
                ref={titleInputRef}
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a title for your note..."
                className="input w-full"
                disabled={isSaving}
                autoFocus={!showTemplates}
                maxLength={100}
              />
            </div>
            
            {/* Content Input */}
            <div className="space-y-2">
              <label htmlFor="note-content" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Content
              </label>
              <div className="relative">
                <textarea
                  id="note-content"
                  ref={textareaRef}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={showTemplates ? "Choose a template above or start writing..." : "Write your note content here..."}
                  className="input w-full min-h-[100px] max-h-[200px] resize-none overflow-y-auto"
                  disabled={isSaving}
                  autoFocus={showTemplates && !noteTitle.trim()}
                />
                {noteContent.length > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs text-slate-400 bg-white dark:bg-slate-800 px-1 rounded">
                    {noteContent.length} chars
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveNote} 
                  className="btn-primary flex items-center gap-2 flex-1 sm:flex-initial"
                  disabled={isSaving || (!noteTitle.trim() && !noteContent.trim())}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Note</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={handleCancel}
                  className="btn-ghost px-4"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
              
              <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">Ctrl+Enter</kbd> to save, <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">Esc</kbd> to cancel
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="text-center py-8">
            <StickyNote className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">No notes yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Keep track of important information about this contact
            </p>
            <button
              onClick={() => {
                setShowForm(true);
                setShowTemplates(true);
              }}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add Your First Note
            </button>
          </div>
        )
      )}
    </div>
  );
};
