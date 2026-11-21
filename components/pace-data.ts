import type { EnergyLevel } from "@/components/pace-energy-picker"

export type EffortLevel = "low" | "medium" | "high"
export type TaskType = "mental" | "social" | "physical"
export type CompletionFeeling = "easier" | "expected" | "harder"
export type RestActivityType = "nap" | "walk" | "quiet"
export type AssignmentBucket = "now" | "if-energy" | "leave-alone"

export interface PaceTask {
  id: string
  name: string
  subject: string
  dueDate: string
  effort: EffortLevel
  taskType: TaskType
  estimatedMinutes: number
  plannedDate: string
  completedOn?: string
}

export interface SymptomEntry {
  id: string
  symptom: string
  severity: number
  note: string
  date: string
  loggedAt: string
}

export interface EnergyDay {
  date: string
  level: EnergyLevel
}

export interface RestEntry {
  id: string
  activity: RestActivityType
  points: number
  date: string
}

export interface TaskReview {
  taskId: string
  date: string
  taskType: TaskType
  feeling: CompletionFeeling
}

export interface PaceProfile {
  name: string
  conditions: string[]
  subjects: string[]
  safeDailyLimit: number
  onboardingComplete: boolean
  theme: "light" | "dark"
  dyslexiaFont: boolean
  highContrast: boolean
  reducedMotion: boolean
  textScale: number
}

export interface PaceData {
  version: 2
  energy: EnergyLevel
  tasks: PaceTask[]
  symptoms: SymptomEntry[]
  customSymptoms: string[]
  energyHistory: EnergyDay[]
  restActivities: RestEntry[]
  taskReviews: TaskReview[]
  profile: PaceProfile
}

export const PACE_STORAGE_KEY = "pace-demo-data-v2"

export const conditionOptions = ["Long COVID", "ME/CFS", "POTS", "Migraine", "Something else"]

export const taskTypeLabels: Record<TaskType, string> = {
  mental: "Mental",
  social: "Social",
  physical: "Physical",
}

export function getDefaultProfile(): PaceProfile {
  return {
    name: "",
    conditions: [],
    subjects: ["Biology", "History", "Anatomy"],
    safeDailyLimit: 60,
    onboardingComplete: false,
    theme: "light",
    dyslexiaFont: false,
    highContrast: false,
    reducedMotion: false,
    textScale: 1,
  }
}

export const restActivities: Array<{ type: RestActivityType; label: string; points: number; detail: string }> = [
  { type: "nap", label: "Nap", points: 15, detail: "A little time to fully switch off." },
  { type: "walk", label: "Gentle walk", points: 8, detail: "A short change of scenery, if it feels good." },
  { type: "quiet", label: "Quiet time", points: 10, detail: "A few minutes with fewer sounds and asks." },
]

export function getDailyEnergyLimit(energy: EnergyLevel, guardActive: boolean, safeDailyLimit: number) {
  if (energy === "drained") return Math.min(10, safeDailyLimit)
  if (guardActive) return Math.min(15, safeDailyLimit)
  if (energy === "low") return Math.round(safeDailyLimit * 0.4)
  if (energy === "okay") return Math.round(safeDailyLimit * 0.7)
  return safeDailyLimit
}

export function getDailyEnergyUsage(tasks: PaceTask[], reviews: TaskReview[], rests: RestEntry[], today: string) {
  const taskPoints = tasks.reduce((sum, task) => {
    if (task.completedOn !== today) return sum
    const review = reviews.find((entry) => entry.taskId === task.id && entry.date === today)
    const adjustment = review?.feeling === "harder" ? 10 : review?.feeling === "easier" ? -5 : 0
    return sum + Math.max(0, effortPoints(task.effort) + adjustment)
  }, 0)
  const restored = rests.reduce((sum, entry) => entry.date === today ? sum + entry.points : sum, 0)
  return { used: Math.max(0, taskPoints - restored), restored }
}

export const symptomOptions = [
  "Fatigue",
  "Headache",
  "Brain fog",
  "Dizziness",
  "Pain",
  "Nausea",
]

export function getDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function shiftDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const date = new Date(year, month - 1, day + days)
  return getDateKey(date)
}

export function daysUntil(dueDate: string, today: string) {
  const due = new Date(`${dueDate}T12:00:00`)
  const current = new Date(`${today}T12:00:00`)
  return Math.round((due.getTime() - current.getTime()) / 86_400_000)
}

export function formatDueDate(dueDate: string, today: string) {
  const days = daysUntil(dueDate, today)
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`
  if (days === 0) return "Due today"
  if (days === 1) return "Due tomorrow"
  return `Due ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${dueDate}T12:00:00`))}`
}

export function effortPoints(effort: EffortLevel) {
  return effort === "low" ? 10 : effort === "medium" ? 20 : 30
}

export function isCompleteToday(task: PaceTask, today: string) {
  return task.completedOn === today
}

export function isTaskComplete(task: PaceTask) {
  return Boolean(task.completedOn)
}

export function isCrashGuardActive(data: PaceData, today: string) {
  return data.energy === "drained" || data.symptoms.some((entry) => entry.date === today && entry.severity >= 4)
}

export function deferOpenTasks(tasks: PaceTask[], today: string) {
  const tomorrow = shiftDateKey(today, 1)
  return tasks.map((task) => {
    const isOpen = !isTaskComplete(task)
    const isPlannedForNow = task.plannedDate <= today
    return isOpen && isPlannedForNow ? { ...task, plannedDate: tomorrow } : task
  })
}

export function bucketTask(
  task: PaceTask,
  energy: EnergyLevel,
  guardActive: boolean,
  today: string,
): AssignmentBucket | null {
  if (isTaskComplete(task)) return null
  if (task.plannedDate > today || guardActive || energy === "drained") return "leave-alone"

  const daysToDue = daysUntil(task.dueDate, today)
  if (daysToDue <= 0) return energy === "low" ? "if-energy" : "now"
  if (daysToDue === 1) {
    if (energy === "charged" && task.effort !== "high") return "now"
    return "if-energy"
  }
  if (daysToDue <= 3 && energy === "charged" && task.effort === "low") return "if-energy"
  return "leave-alone"
}

function makeDemoTask(
  id: string,
  name: string,
  subject: string,
  dueDate: string,
  plannedDate: string,
  effort: EffortLevel,
  estimatedMinutes: number,
  taskType: TaskType,
): PaceTask {
  return { id, name, subject, dueDate, plannedDate, effort, estimatedMinutes, taskType }
}

function makeEnergyHistory(today: string, levels: EnergyLevel[]) {
  return levels.map((level, index) => ({ date: shiftDateKey(today, index - 6), level }))
}

export function getDemoData(reference = new Date()): PaceData {
  const today = getDateKey(reference)
  const days = Array.from({ length: 7 }, (_, index) => shiftDateKey(today, index - 6))
  const levels: EnergyLevel[] = ["okay", "low", "okay", "charged", "charged", "drained", "low"]

  return {
    version: 2,
    energy: "low",
    tasks: [
      makeDemoTask("demo-teacher-email", "Email a teacher about the biology reflection", "Biology", today, today, "low", 5, "social"),
      makeDemoTask("demo-biology-reflection", "Biology lab reflection", "Biology", shiftDateKey(today, 1), today, "medium", 20, "mental"),
      makeDemoTask("demo-history-essay", "Draft the history essay opening", "History", shiftDateKey(today, 5), today, "high", 30, "mental"),
      makeDemoTask("demo-anatomy-notes", "Review anatomy lecture notes", "Anatomy", shiftDateKey(today, 3), today, "medium", 15, "mental"),
    ],
    symptoms: [
      { id: "demo-fatigue-early", symptom: "Fatigue", severity: 2, note: "Needed a slower morning.", date: days[2], loggedAt: `${days[2]}T09:15:00` },
      { id: "demo-headache", symptom: "Headache", severity: 2, note: "", date: days[3], loggedAt: `${days[3]}T13:00:00` },
      { id: "demo-fatigue-crash", symptom: "Fatigue", severity: 4, note: "More tired the day after a full study day.", date: days[5], loggedAt: `${days[5]}T10:30:00` },
      { id: "demo-brain-fog-crash", symptom: "Brain fog", severity: 4, note: "", date: days[5], loggedAt: `${days[5]}T10:35:00` },
      { id: "demo-fatigue-today", symptom: "Fatigue", severity: 2, note: "", date: today, loggedAt: `${today}T09:00:00` },
    ],
    customSymptoms: [],
    energyHistory: makeEnergyHistory(today, levels),
    restActivities: [],
    taskReviews: [],
    profile: getDefaultProfile(),
  }
}

export function getDemoPresetData(preset: "finals" | "crash", reference = new Date()): PaceData {
  const today = getDateKey(reference)
  const days = Array.from({ length: 7 }, (_, index) => shiftDateKey(today, index - 6))
  const base = getDemoData(reference)

  if (preset === "crash") {
    return {
      ...base,
      energy: "drained",
      tasks: [
        makeDemoTask("crash-teacher-note", "Send one note about the biology reflection", "Biology", today, today, "low", 5, "social"),
        makeDemoTask("crash-lab-reflection", "Biology lab reflection", "Biology", shiftDateKey(today, 1), today, "high", 40, "mental"),
        makeDemoTask("crash-history-reading", "Read the history chapter", "History", shiftDateKey(today, 3), today, "medium", 25, "mental"),
        makeDemoTask("crash-short-walk", "Take a short walk outside", "Wellbeing", shiftDateKey(today, 2), today, "low", 10, "physical"),
      ],
      symptoms: [
        { id: "crash-fatigue", symptom: "Fatigue", severity: 5, note: "A harder day. Rest can come first.", date: today, loggedAt: `${today}T09:00:00` },
        { id: "crash-brain-fog", symptom: "Brain fog", severity: 4, note: "", date: today, loggedAt: `${today}T09:05:00` },
        { id: "crash-pain-yesterday", symptom: "Pain", severity: 3, note: "", date: days[5], loggedAt: `${days[5]}T12:00:00` },
      ],
      energyHistory: makeEnergyHistory(today, ["okay", "charged", "okay", "low", "low", "drained", "drained"]),
    }
  }

  return {
    ...base,
    energy: "low",
    tasks: [
      makeDemoTask("finals-biology-outline", "Write three bullets for the biology reflection", "Biology", today, today, "medium", 25, "mental"),
      makeDemoTask("finals-teacher-email", "Ask a teacher for a little more time", "Biology", today, today, "low", 5, "social"),
      makeDemoTask("finals-history-review", "Review one history topic", "History", shiftDateKey(today, 1), today, "high", 35, "mental"),
      makeDemoTask("finals-anatomy-lab", "Pack materials for anatomy lab", "Anatomy", shiftDateKey(today, 2), today, "low", 10, "physical"),
      makeDemoTask("finals-rest-break", "Take a quiet break between subjects", "Wellbeing", shiftDateKey(today, 1), today, "low", 10, "physical"),
    ],
    symptoms: [
      { id: "finals-fatigue", symptom: "Fatigue", severity: 3, note: "A full week, taking things one step at a time.", date: today, loggedAt: `${today}T08:45:00` },
      { id: "finals-brain-fog", symptom: "Brain fog", severity: 2, note: "", date: days[5], loggedAt: `${days[5]}T10:00:00` },
      { id: "finals-headache", symptom: "Headache", severity: 2, note: "", date: days[3], loggedAt: `${days[3]}T13:00:00` },
    ],
    energyHistory: makeEnergyHistory(today, ["low", "okay", "charged", "low", "okay", "drained", "low"]),
  }
}

function isEnergyLevel(value: unknown): value is EnergyLevel {
  return value === "drained" || value === "low" || value === "okay" || value === "charged"
}

function isEffortLevel(value: unknown): value is EffortLevel {
  return value === "low" || value === "medium" || value === "high"
}

function isTaskType(value: unknown): value is TaskType {
  return value === "mental" || value === "social" || value === "physical"
}

function isCompletionFeeling(value: unknown): value is CompletionFeeling {
  return value === "easier" || value === "expected" || value === "harder"
}

function parseProfile(value: unknown): PaceProfile {
  const fallback = getDefaultProfile()
  if (!value || typeof value !== "object") return { ...fallback, onboardingComplete: true }
  const profile = value as Partial<PaceProfile>
  return {
    name: typeof profile.name === "string" ? profile.name.slice(0, 48) : fallback.name,
    conditions: Array.isArray(profile.conditions) ? profile.conditions.filter((item): item is string => typeof item === "string").slice(0, 12) : fallback.conditions,
    subjects: Array.isArray(profile.subjects) ? profile.subjects.filter((item): item is string => typeof item === "string").slice(0, 20) : fallback.subjects,
    safeDailyLimit: typeof profile.safeDailyLimit === "number" && Number.isFinite(profile.safeDailyLimit)
      ? Math.min(100, Math.max(10, Math.round(profile.safeDailyLimit)))
      : fallback.safeDailyLimit,
    onboardingComplete: typeof profile.onboardingComplete === "boolean" ? profile.onboardingComplete : true,
    theme: profile.theme === "dark" ? "dark" : "light",
    dyslexiaFont: profile.dyslexiaFont === true,
    highContrast: profile.highContrast === true,
    reducedMotion: profile.reducedMotion === true,
    textScale: typeof profile.textScale === "number" && Number.isFinite(profile.textScale)
      ? Math.min(1.3, Math.max(0.9, profile.textScale))
      : fallback.textScale,
  }
}

export function parsePaceData(raw: string | null): PaceData | null {
  if (!raw) return null

  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== "object") return null
    const candidate = value as Partial<PaceData>
    if (
      candidate.version !== 2 ||
      !isEnergyLevel(candidate.energy) ||
      !Array.isArray(candidate.tasks) ||
      !Array.isArray(candidate.symptoms) ||
      !Array.isArray(candidate.customSymptoms) ||
      !Array.isArray(candidate.energyHistory)
    ) {
      return null
    }

    const tasks = candidate.tasks.flatMap((task): PaceTask[] => {
      if (!task || typeof task !== "object") return []
      const valid = Boolean(
        typeof task.id === "string" &&
          typeof task.name === "string" &&
          typeof task.subject === "string" &&
          typeof task.dueDate === "string" &&
          typeof task.plannedDate === "string" &&
          isEffortLevel(task.effort) &&
          Number.isFinite(task.estimatedMinutes) &&
          task.estimatedMinutes >= 1 &&
          task.estimatedMinutes <= 360 &&
          (task.completedOn === undefined || typeof task.completedOn === "string"),
      )
      return valid ? [{ ...task, taskType: isTaskType(task.taskType) ? task.taskType : "mental" }] : []
    })

    const symptoms = candidate.symptoms.filter((entry): entry is SymptomEntry => {
      if (!entry || typeof entry !== "object") return false
      return Boolean(
        typeof entry.id === "string" &&
          typeof entry.symptom === "string" &&
          Number.isInteger(entry.severity) &&
          entry.severity >= 1 &&
          entry.severity <= 5 &&
          typeof entry.note === "string" &&
          typeof entry.date === "string" &&
          typeof entry.loggedAt === "string",
      )
    })

    const energyHistory = candidate.energyHistory.filter((day): day is EnergyDay => {
      if (!day || typeof day !== "object") return false
      return typeof day.date === "string" && isEnergyLevel(day.level)
    })
    const restEntries = Array.isArray(candidate.restActivities)
      ? candidate.restActivities.filter((entry): entry is RestEntry => Boolean(
          entry && typeof entry === "object" &&
          typeof entry.id === "string" &&
          (entry.activity === "nap" || entry.activity === "walk" || entry.activity === "quiet") &&
          typeof entry.date === "string" && Number.isFinite(entry.points) && entry.points >= 0 && entry.points <= 30,
        ))
      : []
    const taskReviews = Array.isArray(candidate.taskReviews)
      ? candidate.taskReviews.filter((entry): entry is TaskReview => Boolean(
          entry && typeof entry === "object" &&
          typeof entry.taskId === "string" &&
          typeof entry.date === "string" &&
          isTaskType(entry.taskType) &&
          isCompletionFeeling(entry.feeling),
        ))
      : []

    return {
      version: 2,
      energy: candidate.energy,
      tasks,
      symptoms,
      customSymptoms: candidate.customSymptoms.filter((item): item is string => typeof item === "string"),
      energyHistory,
      restActivities: restEntries,
      taskReviews,
      profile: parseProfile(candidate.profile),
    }
  } catch {
    return null
  }
}
