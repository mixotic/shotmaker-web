import { create } from "zustand";

interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  assetCount: number;
  storageUsed: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectFull {
  id: string;
  name: string;
  description: string;
  projectData: any;
  storageUsed: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStore {
  projects: ProjectSummary[];
  currentProject: ProjectFull | null;
  isDirty: boolean;
  isSaving: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";

  fetchProjects: () => Promise<void>;
  createProject: (name: string, description: string) => Promise<ProjectFull>;
  deleteProject: (id: string) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  updateProjectData: (updates: Partial<any>) => void;
  updateProjectName: (name: string) => void;
  saveProject: () => Promise<void>;
  flushSave: () => Promise<void>;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  isDirty: false,
  isSaving: false,
  saveStatus: "idle",

  fetchProjects: async () => {
    const res = await fetch("/api/projects");
    if (res.ok) {
      set({ projects: await res.json() });
    }
  },

  createProject: async (name, description) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error("Failed to create project");
    const project = await res.json();
    return project;
  },

  deleteProject: async (id) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  loadProject: async (id) => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) throw new Error("Failed to load project");
    const project = await res.json();
    set({ currentProject: project, isDirty: false, saveStatus: "idle" });
  },

  updateProjectData: (updates) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const newData = { ...currentProject.projectData, ...updates, updatedAt: new Date().toISOString() };
    set({
      currentProject: { ...currentProject, projectData: newData },
      isDirty: true,
      saveStatus: "idle",
    });

    // Debounced auto-save
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveProject(), 1000);
  },

  updateProjectName: (name) => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({
      currentProject: { ...currentProject, name },
      isDirty: true,
      saveStatus: "idle",
    });
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveProject(), 1000);
  },

  flushSave: async () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    await get().saveProject();
  },

  saveProject: async () => {
    const { currentProject, isSaving } = get();
    if (!currentProject || isSaving) return;

    set({ isSaving: true, saveStatus: "saving" });
    try {
      const res = await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentProject.name,
          description: currentProject.description,
          projectData: currentProject.projectData,
        }),
      });
      if (res.ok) {
        set({ isDirty: false, isSaving: false, saveStatus: "saved" });
      } else {
        set({ isSaving: false, saveStatus: "error" });
      }
    } catch {
      set({ isSaving: false, saveStatus: "error" });
    }
  },
}));
