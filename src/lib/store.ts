import { v4 as uuidv4 } from "uuid";

// Types
export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  status: "reference" | "draft" | "final" | "published";
  collectionIds: string[];
  codexEntryIds: string[];
  storyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  coverImageUrl?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CodexEntry {
  id: string;
  title: string;
  type: "character" | "world" | "concept" | "technique" | "reference" | "other";
  content: string; // Markdown
  collectionId?: string;
  linkedArtworkIds: string[];
  linkedStoryIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  status: "draft" | "in_progress" | "completed" | "published";
  scenes: StoryScene[];
  createdAt: string;
  updatedAt: string;
}

export interface StoryScene {
  id: string;
  sceneNumber: number;
  title: string;
  description: string;
  artworkId?: string;
  codexEntryId?: string;
}

// Store helpers
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(`orbit_${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(`orbit_${key}`, JSON.stringify(value));
}

// Seed data
const SEED_COLLECTIONS: Collection[] = [
  {
    id: "col-1",
    name: "Character Studies",
    description: "Explorations of recurring characters across my creative universe",
    color: "#FF6B4A",
    coverImageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
    pinned: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-10T14:00:00Z",
  },
  {
    id: "col-2",
    name: "Sci-Fi World",
    description: "Building a dystopian future city — architecture, atmosphere, and life",
    color: "#2D1B69",
    coverImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
    pinned: true,
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-03-12T16:00:00Z",
  },
  {
    id: "col-3",
    name: "Experimental",
    description: "Abstract explorations and style experiments",
    color: "#8B9E7D",
    coverImageUrl: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&q=80",
    pinned: false,
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
  },
  {
    id: "col-4",
    name: "Neon Cities",
    description: "Cyberpunk cityscapes bathed in neon light",
    color: "#6B4AFF",
    coverImageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&q=80",
    pinned: false,
    createdAt: "2024-02-25T10:00:00Z",
    updatedAt: "2024-03-08T10:00:00Z",
  },
];

const SEED_ARTWORKS: Artwork[] = [
  {
    id: "art-1",
    title: "Aria — First Light",
    description: "Portrait study of Aria in dawn light, cybernetic enhancements visible",
    imageUrl: "https://images.unsplash.com/photo-1633957897986-70e83293f3ff?w=600&q=80",
    tags: ["portrait", "character", "cyberpunk"],
    status: "final",
    collectionIds: ["col-1"],
    codexEntryIds: ["codex-1"],
    storyIds: ["story-1"],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "art-2",
    title: "Neon Skyline",
    description: "Panoramic view of the city at night — towering structures against smog",
    imageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80",
    tags: ["cityscape", "neon", "atmosphere"],
    status: "final",
    collectionIds: ["col-2", "col-4"],
    codexEntryIds: ["codex-2"],
    storyIds: ["story-1"],
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-02-10T10:00:00Z",
  },
  {
    id: "art-3",
    title: "Abstract Flow #7",
    description: "Experimental piece exploring organic forms in digital space",
    imageUrl: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&q=80",
    tags: ["abstract", "experimental", "organic"],
    status: "draft",
    collectionIds: ["col-3"],
    codexEntryIds: [],
    storyIds: [],
    createdAt: "2024-02-15T10:00:00Z",
    updatedAt: "2024-02-15T10:00:00Z",
  },
  {
    id: "art-4",
    title: "The Council Assembled",
    description: "Group scene — the rebel leaders meeting in the underground",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    tags: ["group", "scene", "story"],
    status: "final",
    collectionIds: ["col-2"],
    codexEntryIds: [],
    storyIds: ["story-1"],
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
  },
  {
    id: "art-5",
    title: "Aria in Action",
    description: "Dynamic pose — Aria leading the charge through the city streets",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    tags: ["action", "character", "dynamic"],
    status: "final",
    collectionIds: ["col-1", "col-2"],
    codexEntryIds: ["codex-1"],
    storyIds: ["story-1"],
    createdAt: "2024-03-05T10:00:00Z",
    updatedAt: "2024-03-05T10:00:00Z",
  },
  {
    id: "art-6",
    title: "Exodus Fleet",
    description: "Final illustration — the fleet departing the dying world",
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80",
    tags: ["fleet", "space", "finale"],
    status: "published",
    collectionIds: ["col-2"],
    codexEntryIds: [],
    storyIds: ["story-1"],
    createdAt: "2024-03-10T10:00:00Z",
    updatedAt: "2024-03-10T10:00:00Z",
  },
];

const SEED_CODEX: CodexEntry[] = [
  {
    id: "codex-1",
    title: "Aria",
    type: "character",
    content: `# Aria — Character Profile\n\n**Role:** Protagonist, Rebel Leader\n**Species:** Human-Synthetic Hybrid\n**Age:** 28\n\n## Appearance\nTall, cybernetic enhancements on left side. Sharp features softened by warm brown eyes. Hair cropped short on the right, flowing on the left to cover the neural interface port.\n\n## Character Arc\nAria discovers the truth about the city's AI governance and leads a rebellion to free the population. Her journey is one of self-discovery — learning that her synthetic half gives her unique insight into both human and machine consciousness.`,
    collectionId: "col-1",
    linkedArtworkIds: ["art-1", "art-5"],
    linkedStoryIds: ["story-1"],
    createdAt: "2024-01-28T10:00:00Z",
    updatedAt: "2024-03-05T10:00:00Z",
  },
  {
    id: "codex-2",
    title: "Neon City Architecture",
    type: "world",
    content: `# Neon City — World Building\n\n## Overview\nA sprawling megalopolis built vertically, where the wealthy live in sunlit towers above the smog line, and the rest survive in the perpetual twilight below.\n\n## Architecture\n- **Upper Levels:** Clean lines, glass and steel, holographic gardens\n- **Mid Levels:** Industrial, functional, neon-lit markets\n- **Lower Levels:** Organic growth, makeshift structures, bioluminescent fungi\n\n## Atmosphere\nPerpetual rain above, recycled air below. The city never truly sleeps — shifts overlap, lights never dim.`,
    collectionId: "col-2",
    linkedArtworkIds: ["art-2"],
    linkedStoryIds: ["story-1"],
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-02-10T10:00:00Z",
  },
  {
    id: "codex-3",
    title: "Chromatic Layering",
    type: "technique",
    content: `# Chromatic Layering Technique\n\n## Process\n1. Generate base composition with primary prompt\n2. Apply color grading pass with shifted hue parameters\n3. Overlay texture layer at 20-30% opacity\n4. Final pass with depth-of-field and atmospheric effects\n\n## Best Used For\n- Atmospheric cityscapes\n- Moody portraits\n- Any piece requiring visual depth`,
    linkedArtworkIds: [],
    linkedStoryIds: [],
    createdAt: "2024-02-20T10:00:00Z",
    updatedAt: "2024-02-20T10:00:00Z",
  },
];

const SEED_STORIES: Story[] = [
  {
    id: "story-1",
    title: "The Exodus",
    description: "A story of rebellion and escape across a dying world",
    status: "completed",
    scenes: [
      { id: "sc-1", sceneNumber: 1, title: "Aria discovers the truth", description: "The moment everything changes", artworkId: "art-1", codexEntryId: "codex-1" },
      { id: "sc-2", sceneNumber: 2, title: "The rebellion forms", description: "Underground meeting of the resistance", artworkId: "art-4" },
      { id: "sc-3", sceneNumber: 3, title: "Escape through the Neon Cities", description: "A desperate flight through the city's layers", artworkId: "art-2", codexEntryId: "codex-2" },
      { id: "sc-4", sceneNumber: 4, title: "The Final Departure", description: "The fleet launches into the unknown", artworkId: "art-6" },
    ],
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-03-10T10:00:00Z",
  },
  {
    id: "story-2",
    title: "Origin",
    description: "How the world began — the creation myth of the Neon City civilization",
    status: "in_progress",
    scenes: [
      { id: "sc-5", sceneNumber: 1, title: "The First Light", description: "Before the city, there was only the void" },
      { id: "sc-6", sceneNumber: 2, title: "The Builders", description: "Those who laid the foundations" },
    ],
    createdAt: "2024-03-15T10:00:00Z",
    updatedAt: "2024-03-15T10:00:00Z",
  },
];

// Initialize with seed data if empty
function initStore() {
  if (!localStorage.getItem("orbit_collections")) {
    saveToStorage("collections", SEED_COLLECTIONS);
  }
  if (!localStorage.getItem("orbit_artworks")) {
    saveToStorage("artworks", SEED_ARTWORKS);
  }
  if (!localStorage.getItem("orbit_codex")) {
    saveToStorage("codex", SEED_CODEX);
  }
  if (!localStorage.getItem("orbit_stories")) {
    saveToStorage("stories", SEED_STORIES);
  }
}

initStore();

// CRUD Operations
export const store = {
  // Collections
  getCollections: (): Collection[] => loadFromStorage("collections", SEED_COLLECTIONS),
  getCollection: (id: string): Collection | undefined => store.getCollections().find((c) => c.id === id),
  saveCollection: (col: Partial<Collection> & { name: string }): Collection => {
    const collections = store.getCollections();
    const now = new Date().toISOString();
    if (col.id) {
      const idx = collections.findIndex((c) => c.id === col.id);
      if (idx >= 0) {
        collections[idx] = { ...collections[idx], ...col, updatedAt: now };
        saveToStorage("collections", collections);
        return collections[idx];
      }
    }
    const newCol: Collection = {
      id: uuidv4(),
      name: col.name,
      description: col.description || "",
      color: col.color || "#2D1B69",
      coverImageUrl: col.coverImageUrl,
      pinned: col.pinned ?? false,
      createdAt: now,
      updatedAt: now,
    };
    collections.push(newCol);
    saveToStorage("collections", collections);
    return newCol;
  },
  deleteCollection: (id: string) => {
    saveToStorage("collections", store.getCollections().filter((c) => c.id !== id));
  },

  // Artworks
  getArtworks: (): Artwork[] => loadFromStorage("artworks", SEED_ARTWORKS),
  getArtwork: (id: string): Artwork | undefined => store.getArtworks().find((a) => a.id === id),
  getArtworksByCollection: (colId: string): Artwork[] =>
    store.getArtworks().filter((a) => a.collectionIds.includes(colId)),
  saveArtwork: (art: Partial<Artwork> & { title: string }): Artwork => {
    const artworks = store.getArtworks();
    const now = new Date().toISOString();
    if (art.id) {
      const idx = artworks.findIndex((a) => a.id === art.id);
      if (idx >= 0) {
        artworks[idx] = { ...artworks[idx], ...art, updatedAt: now };
        saveToStorage("artworks", artworks);
        return artworks[idx];
      }
    }
    const newArt: Artwork = {
      id: uuidv4(),
      title: art.title,
      description: art.description || "",
      imageUrl: art.imageUrl || "",
      tags: art.tags || [],
      status: art.status || "draft",
      collectionIds: art.collectionIds || [],
      codexEntryIds: art.codexEntryIds || [],
      storyIds: art.storyIds || [],
      createdAt: now,
      updatedAt: now,
    };
    artworks.push(newArt);
    saveToStorage("artworks", artworks);
    return newArt;
  },
  deleteArtwork: (id: string) => {
    saveToStorage("artworks", store.getArtworks().filter((a) => a.id !== id));
  },

  // Codex
  getCodexEntries: (): CodexEntry[] => loadFromStorage("codex", SEED_CODEX),
  getCodexEntry: (id: string): CodexEntry | undefined => store.getCodexEntries().find((e) => e.id === id),
  saveCodexEntry: (entry: Partial<CodexEntry> & { title: string }): CodexEntry => {
    const entries = store.getCodexEntries();
    const now = new Date().toISOString();
    if (entry.id) {
      const idx = entries.findIndex((e) => e.id === entry.id);
      if (idx >= 0) {
        entries[idx] = { ...entries[idx], ...entry, updatedAt: now };
        saveToStorage("codex", entries);
        return entries[idx];
      }
    }
    const newEntry: CodexEntry = {
      id: uuidv4(),
      title: entry.title,
      type: entry.type || "other",
      content: entry.content || "",
      collectionId: entry.collectionId,
      linkedArtworkIds: entry.linkedArtworkIds || [],
      linkedStoryIds: entry.linkedStoryIds || [],
      createdAt: now,
      updatedAt: now,
    };
    entries.push(newEntry);
    saveToStorage("codex", entries);
    return newEntry;
  },
  deleteCodexEntry: (id: string) => {
    saveToStorage("codex", store.getCodexEntries().filter((e) => e.id !== id));
  },

  // Stories
  getStories: (): Story[] => loadFromStorage("stories", SEED_STORIES),
  getStory: (id: string): Story | undefined => store.getStories().find((s) => s.id === id),
  saveStory: (story: Partial<Story> & { title: string }): Story => {
    const stories = store.getStories();
    const now = new Date().toISOString();
    if (story.id) {
      const idx = stories.findIndex((s) => s.id === story.id);
      if (idx >= 0) {
        stories[idx] = { ...stories[idx], ...story, updatedAt: now };
        saveToStorage("stories", stories);
        return stories[idx];
      }
    }
    const newStory: Story = {
      id: uuidv4(),
      title: story.title,
      description: story.description || "",
      status: story.status || "draft",
      scenes: story.scenes || [],
      createdAt: now,
      updatedAt: now,
    };
    stories.push(newStory);
    saveToStorage("stories", stories);
    return newStory;
  },
  deleteStory: (id: string) => {
    saveToStorage("stories", store.getStories().filter((s) => s.id !== id));
  },

  // Stats
  getStats: () => ({
    totalArtworks: store.getArtworks().length,
    totalCollections: store.getCollections().length,
    totalCodexEntries: store.getCodexEntries().length,
    totalStories: store.getStories().length,
  }),
};
