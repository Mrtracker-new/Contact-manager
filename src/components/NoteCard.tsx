import { useState } from 'react';
import { StickyNote, CalendarDays, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { dateUtils } from '../utils';

interface NoteCardProps {
  note: {
    id?: number;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  };
  onDelete: (id: number) => void;
}

export const NoteCard = ({ note, onDelete }: NoteCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center text-secondary-600 dark:text-secondary-400">
          <StickyNote className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {note.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {dateUtils.formatDate(note.createdAt, 'PPp')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id!);
            }}
            className="p-2 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            aria-label="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-slate-600 dark:text-slate-400"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {note.content}
            </p>
            {note.updatedAt > note.createdAt && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Last updated: {dateUtils.formatDate(note.updatedAt, 'PPp')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
