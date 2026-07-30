import React, { useState } from 'react';
import { Track } from '../types';
import { Layers, Plus, Edit2, Trash2, Eye, EyeOff, ShieldAlert, Check, X } from 'lucide-react';

interface TrackManagerProps {
  tracks: Track[];
  onCreateTrack: (track: Omit<Track, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateTrack: (id: string, updates: Partial<Track>) => void;
  onDeleteTrack: (id: string) => void;
  onClose?: () => void;
}

export const TrackManager: React.FC<TrackManagerProps> = ({
  tracks,
  onCreateTrack,
  onUpdateTrack,
  onDeleteTrack,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New track form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [isHidden, setIsHidden] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIsHidden, setEditIsHidden] = useState(false);
  const [editIsPlanning, setEditIsPlanning] = useState(false);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    onCreateTrack({
      name,
      slug,
      description,
      color,
      is_hidden: isHidden,
      is_planning: isPlanning,
      display_order: tracks.length + 1,
    });

    setName('');
    setDescription('');
    setColor('#3B82F6');
    setIsHidden(false);
    setIsPlanning(false);
    setIsCreating(false);
  };

  const startEdit = (track: Track) => {
    setEditingId(track.id);
    setEditName(track.name);
    setEditDescription(track.description);
    setEditColor(track.color);
    setEditIsHidden(track.is_hidden);
    setEditIsPlanning(track.is_planning);
  };

  const saveEdit = (id: string) => {
    onUpdateTrack(id, {
      name: editName,
      description: editDescription,
      color: editColor,
      is_hidden: editIsHidden,
      is_planning: editIsPlanning,
    });
    setEditingId(null);
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-5 font-mono">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase italic">Dynamic Track Registry</h2>
            <p className="text-[11px] text-zinc-400">Configure tracks, set athlete visibility, and deploy planning streams</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold uppercase bg-zinc-100 hover:bg-white text-black rounded transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Track</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Create Track Form Drawer */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="bg-zinc-950 p-4 rounded border border-indigo-500/30 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="text-xs font-bold text-indigo-400 flex items-center space-x-2 uppercase">
              <Plus className="h-3.5 w-3.5" />
              <span>New Workout Track</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-zinc-400 font-bold mb-1 uppercase text-[10px]">Track Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Olympic Weightlifting"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-bold mb-1 uppercase text-[10px]">Badge Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-10 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
                />
                <span className="text-zinc-400 font-mono text-xs">{color}</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-bold mb-1 uppercase text-[10px]">Description</label>
              <input
                type="text"
                placeholder="Brief summary of track focus..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-6 sm:col-span-2 py-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0"
                />
                <span className="text-zinc-300 font-mono text-xs">Hidden Track (Hide from Athletes)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPlanning}
                  onChange={(e) => setIsPlanning(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-0"
                />
                <span className="text-zinc-300 font-mono text-xs">Planning Track (Coaches Draft Cycle)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold uppercase bg-indigo-600 hover:bg-indigo-500 text-white rounded font-mono"
            >
              Deploy Track
            </button>
          </div>
        </form>
      )}

      {/* Tracks Table / List */}
      <div className="space-y-2">
        {tracks.map((track) => {
          const isEditing = editingId === track.id;

          return (
            <div
              key={track.id}
              className={`p-3 rounded border font-mono transition ${
                track.is_hidden || track.is_planning
                  ? 'bg-zinc-950/80 border-purple-900/40'
                  : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-white font-mono"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="h-7 w-9 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description..."
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsHidden}
                          onChange={(e) => setEditIsHidden(e.target.checked)}
                          className="h-3.5 w-3.5 text-indigo-600 rounded"
                        />
                        <span className="text-zinc-300 text-[11px]">Hidden</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsPlanning}
                          onChange={(e) => setEditIsPlanning(e.target.checked)}
                          className="h-3.5 w-3.5 text-purple-600 rounded"
                        />
                        <span className="text-zinc-300 text-[11px]">Planning</span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => saveEdit(track.id)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold uppercase bg-emerald-500 text-black rounded"
                      >
                        <Check className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 text-xs text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: track.color }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-white uppercase italic">{track.name}</h4>
                        <span className="text-[10px] font-mono text-zinc-500">/{track.slug}</span>
                        {track.is_hidden && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <EyeOff className="h-2.5 w-2.5" />
                            <span>Hidden</span>
                          </span>
                        )}
                        {track.is_planning && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <ShieldAlert className="h-2.5 w-2.5" />
                            <span>Planning</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{track.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEdit(track)}
                      className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
                      title="Edit Track"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTrack(track.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded transition"
                      title="Delete Track"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
