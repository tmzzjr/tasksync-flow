import { useState, useCallback, useRef, useEffect } from "react";
import {
  Task,
  Subtask,
  loadTasks,
  saveTasks,
  sortTasks,
  createTask,
  TEAM_USERS,
  PRESET_COLORS,
} from "@/lib/taskStore";
import {
  Calendar,
  CheckCircle2,
  Copy,
  Trash2,
  Plus,
  Bookmark,
  X,
  GripVertical
} from "lucide-react";
import logoImg from "@/assets/logo.png";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(() => sortTasks(loadTasks()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newSubText, setNewSubText] = useState("");
  const [newSubAssignee, setNewSubAssignee] = useState("");
  const [editingSubIdx, setEditingSubIdx] = useState<number | null>(null);
  const [editSubText, setEditSubText] = useState("");
  const [editSubAssignee, setEditSubAssignee] = useState("");
  const [dragSubIdx, setDragSubIdx] = useState<number | null>(null);
  const [dragOverSubIdx, setDragOverSubIdx] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const persist = useCallback((updated: Task[]) => {
    const sorted = sortTasks(updated);
    setTasks(sorted);
    saveTasks(sorted);
  }, []);

  const selected = tasks.find((t) => t.id === selectedId) || null;

  // Task CRUD
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    persist([...tasks, createTask(newTaskText.trim())]);
    setNewTaskText("");
  };

  const toggleTask = (id: string) => {
    persist(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = () => {
    if (!selectedId) return;
    persist(tasks.filter((t) => t.id !== selectedId));
    setSelectedId(null);
  };

  const cloneTask = () => {
    if (!selected) return;
    const clone: Task = {
      ...selected,
      id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
      text: `${selected.text} (Copy)`,
      completed: false,
      createdAt: Date.now(),
      isTemplate: false,
    };
    persist([...tasks, clone]);
    setSelectedId(clone.id);
  };

  const updateSelected = (patch: Partial<Task>) => {
    if (!selectedId) return;
    persist(tasks.map((t) => (t.id === selectedId ? { ...t, ...patch } : t)));
  };

  // Subtask CRUD
  const addSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubText.trim() || !selected) return;
    const sub: Subtask = { text: newSubText.trim(), completed: false, assignee: newSubAssignee };
    updateSelected({ subtasks: [...(selected.subtasks || []), sub] });
    setNewSubText("");
    setNewSubAssignee("");
  };

  const toggleSubtask = (idx: number) => {
    if (!selected) return;
    const subs = [...selected.subtasks];
    subs[idx] = { ...subs[idx], completed: !subs[idx].completed };
    updateSelected({ subtasks: subs });
  };

  const removeSubtask = (idx: number) => {
    if (!selected) return;
    updateSelected({ subtasks: selected.subtasks.filter((_, i) => i !== idx) });
  };

  const startEditSub = (idx: number) => {
    if (!selected) return;
    setEditingSubIdx(idx);
    setEditSubText(selected.subtasks[idx].text);
    setEditSubAssignee(selected.subtasks[idx].assignee);
    setTimeout(() => editInputRef.current?.focus(), 10);
  };

  const saveSubEdit = () => {
    if (!selected || editingSubIdx === null || !editSubText.trim()) return;
    const subs = [...selected.subtasks];
    subs[editingSubIdx] = { ...subs[editingSubIdx], text: editSubText.trim(), assignee: editSubAssignee };
    updateSelected({ subtasks: subs });
    setEditingSubIdx(null);
  };

  const handleDragStart = (idx: number) => {
    setDragSubIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    if (dragSubIdx === null) return;
    setDragOverSubIdx(idx);
  };

  const handleDragEnd = () => {
    if (dragSubIdx !== null && dragOverSubIdx !== null && dragSubIdx !== dragOverSubIdx && selected) {
      const subs = [...selected.subtasks];
      const [draggedItem] = subs.splice(dragSubIdx, 1);
      subs.splice(dragOverSubIdx, 0, draggedItem);
      updateSelected({ subtasks: subs });
    }
    setDragSubIdx(null);
    setDragOverSubIdx(null);
  };

  // Urgency helpers
  const getUrgency = (task: Task) => {
    if (!task.dueDate) return { isUrgent: false, isDueToday: false, isDueTomorrow: false, urgencyText: "" };
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const dueDateMs = new Date(task.dueDate + "T23:59:59").getTime();
    const diffMs = dueDateMs - now.getTime();
    const THRESHOLD = 48 * 60 * 60 * 1000;

    if (task.dueDate === todayStr) return { isUrgent: true, isDueToday: true, isDueTomorrow: false, urgencyText: "DUE TODAY" };
    if (task.dueDate === tomorrowStr) return { isUrgent: true, isDueToday: false, isDueTomorrow: true, urgencyText: "DUE TOMORROW" };
    if (diffMs > 0 && diffMs <= THRESHOLD) {
      const hrs = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
      return { isUrgent: true, isDueToday: false, isDueTomorrow: false, urgencyText: `Due in ${hrs} hours` };
    }
    return { isUrgent: false, isDueToday: false, isDueTomorrow: false, urgencyText: "" };
  };

  const dateDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* LEFT SIDEBAR */}
      <div className="w-96 flex flex-col border-r border-border bg-card/50 shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <img src={logoImg} alt="TaskFlow Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TaskFlow</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="text-emerald-500">● Synced</span>
            <span>Team Workspace</span>
          </div>
        </div>

        {/* Add task form */}
        <div className="p-3 border-b border-border">
          <form onSubmit={addTask} className="flex gap-2">
            <input
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="New project..."
              className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {tasks.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No active projects.</p>
          )}
          {tasks.map((task) => {
            const { isUrgent, isDueToday, isDueTomorrow, urgencyText } = getUrgency(task);
            const effectiveColor = task.completed ? "#10b981" : task.color || "#6366f1";
            const subCount = (task.subtasks || []).length;
            const completedSub = (task.subtasks || []).filter((s) => s.completed).length;

            return (
              <li
                key={task.id}
                onClick={() => {
                  setSelectedId(task.id);
                  setEditingSubIdx(null);
                }}
                className={`task-item list-none group flex flex-col p-3 rounded-xl cursor-pointer bg-card/40 border border-border hover:border-muted-foreground/30 ${selectedId === task.id ? "selected" : ""
                  } ${task.completed ? "completed-green opacity-80" : ""} ${isDueToday && !task.completed ? "urgent-today" : isDueTomorrow && !task.completed ? "urgent-tomorrow" : isUrgent && !task.completed ? "urgent" : ""
                  }`}
                style={{ "--task-color": effectiveColor } as React.CSSProperties}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleTask(task.id);
                    }}
                    className="circular-checkbox mt-0.5"
                    style={{ "--task-color": effectiveColor } as React.CSSProperties}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {task.isTemplate && <Bookmark className="w-3 h-3 text-amber-400 shrink-0" />}
                      <p
                        className={`task-text text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : ""
                          }`}
                      >
                        {task.text}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate || "No date"}
                        {urgencyText && (
                          <span
                            className={
                              isDueToday
                                ? "bg-white text-black font-extrabold px-2 py-0.5 rounded shadow-lg animate-pulse-slow ml-1"
                                : isUrgent
                                  ? "bg-black/20 text-white px-1.5 py-0.5 rounded ml-1"
                                  : "ml-1"
                            }
                          >
                            {urgencyText}
                          </span>
                        )}
                      </span>
                      <span>
                        {completedSub}/{subCount} Steps
                      </span>
                    </div>
                  </div>
                  {(!isUrgent || task.completed) && (
                    <div
                      className="w-3 h-3 rounded-full shrink-0 mt-1 opacity-60"
                      style={{ backgroundColor: effectiveColor }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{dateDisplay}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">Project Board</p>
              <p className="text-[10px] text-muted-foreground">{tasks.length} items</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN DETAIL PANEL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a project to manage steps</p>
              <p className="text-xs mt-1 opacity-60">Double-click subtasks to edit details</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title + Actions */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: selected.color || "#6366f1" }}
                />
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateSelected({ text: e.currentTarget.textContent || selected.text })}
                  className="text-xl font-semibold outline-none flex-1"
                >
                  {selected.text}
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={cloneTask}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button
                  onClick={deleteTask}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((hex) => (
                <div
                  key={hex}
                  className={`color-pill ${selected.color === hex ? "active" : ""}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => updateSelected({ color: hex })}
                  data-color={hex}
                />
              ))}
              <div className="color-wheel-container relative">
                <input
                  type="color"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => updateSelected({ color: e.target.value })}
                />
              </div>

              <button
                onClick={() => updateSelected({ isTemplate: !selected.isTemplate })}
                className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ml-auto ${selected.isTemplate
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-border text-muted-foreground"
                  }`}
              >
                <Bookmark className="w-3 h-3" /> Template
              </button>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground font-medium">Due Date</label>
              <input
                type="date"
                value={selected.dueDate}
                onChange={(e) => updateSelected({ dueDate: e.target.value })}
                className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* Subtasks */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Sub-tasks Checklist</h3>
              <form onSubmit={addSubtask} className="flex gap-2">
                <input
                  value={newSubText}
                  onChange={(e) => setNewSubText(e.target.value)}
                  placeholder="Add a step..."
                  className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
                />
                <select
                  value={newSubAssignee}
                  onChange={(e) => setNewSubAssignee(e.target.value)}
                  className="bg-secondary/50 border border-border rounded-lg px-2 py-2 text-xs outline-none"
                >
                  <option value="">Assignee...</option>
                  {TEAM_USERS.map((u) => (
                    <option key={u} value={u}>
                      {u.split("@")[0]}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              <ul className="space-y-2">
                {(selected.subtasks || []).map((sub, idx) => {
                  const effColor = sub.completed ? "#10b981" : selected.color || "#6366f1";
                  const isEditing = editingSubIdx === idx;
                  const isDragging = dragSubIdx === idx;
                  const isOver = dragOverSubIdx === idx && dragSubIdx !== idx;

                  return (
                    <li
                      key={idx}
                      draggable={!isEditing}
                      onDragStart={() => handleDragStart(idx)}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={handleDragEnd}
                      className={`group flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border/40 transition-all ${sub.completed ? "opacity-50 completed-green" : ""
                        } ${isDragging ? "opacity-30 border-dashed border-primary" : ""} ${isOver ? "border-primary bg-primary/5" : ""
                        } cursor-default`}
                      style={{ "--task-color": effColor } as React.CSSProperties}
                      onDoubleClick={() => !isEditing && startEditSub(idx)}
                    >
                      {!isEditing && (
                        <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 -ml-1 pr-1 transition-opacity">
                          <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                      )}
                      {isEditing ? (
                        <>
                          <input
                            ref={editInputRef}
                            value={editSubText}
                            onChange={(e) => setEditSubText(e.target.value)}
                            className="flex-1 bg-secondary/50 border border-border rounded-lg px-2 py-1 text-sm outline-none"
                          />
                          <select
                            value={editSubAssignee}
                            onChange={(e) => setEditSubAssignee(e.target.value)}
                            className="bg-secondary/50 border border-border rounded-lg px-2 py-1 text-xs outline-none"
                          >
                            <option value="">No Assignee</option>
                            {TEAM_USERS.map((u) => (
                              <option key={u} value={u}>
                                {u.split("@")[0]}
                              </option>
                            ))}
                          </select>
                          <button onClick={saveSubEdit} className="text-emerald-400 text-xs font-medium">
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSubIdx(null)}
                            className="text-muted-foreground text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => toggleSubtask(idx)}
                            className="circular-checkbox"
                            style={{ "--task-color": effColor } as React.CSSProperties}
                          />
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-sm ${sub.completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              {sub.text}
                            </span>
                            {sub.assignee && (
                              <span className="text-[10px] text-muted-foreground ml-2">
                                @{sub.assignee.split("@")[0]}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeSubtask(idx)}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
