export interface Subtask {
  text: string;
  completed: boolean;
  assignee: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  color: string;
  dueDate: string;
  subtasks: Subtask[];
  createdAt: number;
  isTemplate: boolean;
}

const STORAGE_KEY = 'taskflow-tasks';

export const TEAM_USERS = [
  "Thomaz@outfitmd.com",
  "Techteam@outfitmd.com",
  "Matheus@outfitmd@gmail.com",
  "Samira@outfitmd@gmail.com",
  "Leo@outfitmd.com",
];

export const PRESET_COLORS = [
  '#6366f1', '#10b981', '#f43f5e', '#f59e0b',
  '#0ea5e9', '#a855f7', '#ffffff', '#ec4899',
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function loadTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.dueDate && !b.dueDate) return (b.createdAt || 0) - (a.createdAt || 0);
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

export function createTask(text: string): Task {
  return {
    id: generateId(),
    text,
    completed: false,
    color: PRESET_COLORS[0],
    dueDate: '',
    subtasks: [],
    createdAt: Date.now(),
    isTemplate: false,
  };
}

export const HARDCODED_TEMPLATE: Task = {
  id: '__template_website_launch__',
  text: 'Website Launch Checklist',
  completed: false,
  color: '#10b981',
  dueDate: '',
  subtasks: [
    { text: 'Setup Business Info', completed: false, assignee: 'Samira@outfitmd@gmail.com' },
    { text: 'Duplicate Snapshot V1 - Create Store', completed: false, assignee: 'Thomaz@outfitmd.com' },
    { text: 'Upload Logo to GHL', completed: false, assignee: 'Thomaz@outfitmd.com' },
    { text: 'Create and Upload Website Images', completed: false, assignee: 'Thomaz@outfitmd.com' },
    { text: 'Create and Upload Products Images', completed: false, assignee: 'Matheus@outfitmd@gmail.com' },
    { text: 'Edit All Snapshot Pages According to Client\'s Brand', completed: false, assignee: 'Thomaz@outfitmd.com' },
    { text: 'Add Products To The Collections', completed: false, assignee: 'Matheus@outfitmd@gmail.com' },
    { text: 'Create Forms on the Contact Us page', completed: false, assignee: 'Matheus@outfitmd@gmail.com' },
    { text: 'Connect Domain', completed: false, assignee: 'Techteam@outfitmd.com' },
    { text: 'Setup Automations', completed: false, assignee: 'Techteam@outfitmd.com' },
    { text: 'Connect Form on the Contact Us Page', completed: false, assignee: 'Thomaz@outfitmd.com' },
    { text: 'Sync Collections + products to the Home Page', completed: false, assignee: 'Thomaz@outfitmd.com' },
    { text: 'Attach header and footer logo links', completed: false, assignee: 'Thomaz@outfitmd.com' },
    { text: 'Add SEO Preview image and Content', completed: false, assignee: 'Thomaz@outfitmd.com' },
    { text: 'Attatch page redirect links to Banners', completed: false, assignee: 'Thomaz@outfitmd.com' },
    { text: 'Review Page content (First Check)', completed: false, assignee: 'Thomaz@outfitmd.com' },
    { text: 'Review Page Content (Last Check)', completed: false, assignee: 'Samira@outfitmd@gmail.com' },
  ],
  createdAt: 0,
  isTemplate: true,
};
