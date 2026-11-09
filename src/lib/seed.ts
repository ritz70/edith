import { App, Permission } from "./types";

export const PERMISSIONS_LIST: Permission[] = [
  { id: "location", label: "Location", sensitivity: "high" },
  { id: "contacts", label: "Contacts", sensitivity: "critical" },
  { id: "microphone", label: "Microphone", sensitivity: "critical" },
  { id: "camera", label: "Camera", sensitivity: "high" },
  { id: "photos", label: "Photos", sensitivity: "high" },
  { id: "files", label: "Files & Storage", sensitivity: "medium" },
  { id: "calendar", label: "Calendar", sensitivity: "medium" },
  { id: "sms", label: "SMS", sensitivity: "critical" },
  { id: "health_data", label: "Health Data", sensitivity: "high" },
  { id: "notifications", label: "Notifications", sensitivity: "low" },
];

export const PERMISSION_CATALOG: Record<string, Permission> = PERMISSIONS_LIST.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<string, Permission>
);

export const INITIAL_APPS: Record<string, App> = {
  photomagic: {
    id: "photomagic",
    name: "PhotoMagic",
    category: "Photo Editor",
    description: "Edit, crop, and enhance photos with smart filters",
    status: "active",
    justified: ["photos", "camera", "files"],
    grants: {
      photos: "allowed",
      camera: "allowed",
      files: "allowed",
    },
    baseline: {
      photos: { rate: 0.35, reason: "Loading gallery images for editing" },
      camera: { rate: 0.05, reason: "Capturing photo within editor" },
      files: { rate: 0.25, reason: "Exporting edited file to storage" },
    },
    requests: [],
  },
  notenest: {
    id: "notenest",
    name: "NoteNest",
    category: "Productivity",
    description: "Markdown notes, audio memos, and task planner",
    status: "active",
    justified: ["files", "calendar", "microphone", "notifications"],
    grants: {
      files: "allowed",
      calendar: "allowed",
      microphone: "allowed",
      notifications: "allowed",
    },
    baseline: {
      files: { rate: 0.30, reason: "Auto-saving note changes" },
      calendar: { rate: 0.15, reason: "Checking calendar event attachments" },
      microphone: { rate: 0.05, reason: "Recording voice memo" },
      notifications: { rate: 0.10, reason: "Sending task reminder alerts" },
    },
    requests: [],
  },
  fitpulse: {
    id: "fitpulse",
    name: "FitPulse",
    category: "Health & Fitness",
    description: "Continuous workout tracking and health metrics",
    status: "active",
    justified: ["location", "health_data", "notifications"],
    grants: {
      location: "allowed",
      health_data: "allowed",
      notifications: "allowed",
    },
    baseline: {
      location: { rate: 0.25, reason: "Syncing workout GPS route" },
      health_data: { rate: 0.35, reason: "Reading continuous heart rate & steps" },
      notifications: { rate: 0.05, reason: "Inactivity reminder notification" },
    },
    requests: [],
  },
};

export const INITIAL_APPS_LIST: App[] = Object.values(INITIAL_APPS);

