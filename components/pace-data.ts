import type { EnergyLevel } from "@/components/pace-energy-picker"

export type EffortLevel = "low" | "medium" | "high"
export type AssignmentBucket = "now" | "if-energy" | "leave-alone"

export interface PaceTask {
  id: string
  name: string
  subject: string
  dueDate: string
  effort: EffortLevel
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

export interface PaceData {
  version: 2
  energy: EnergyLevel
  tasks: PaceTask[]
  symptoms: SymptomEntry[]
  customSymptoms: string[]
  energyHistory: EnergyDay[]
}

export const PACE_STORAGE_KEY = "pace-demo-data-v2"

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

export function getDemoData(reference = new Date()): PaceData {
  const today = getDateKey(reference)
  const days = Array.from({ length: 7 }, (_, index) => shiftDateKey(today, index - 6))
  const dayLevels: EnergyLevel[] = ["okay", "low", "okay", "charged", "charged", "drained", "low"]

  return {
    version: 2,
    energy: "low",
    tasks: [
      {
        id: "demo-professor-email",
        name: "Email professor about the biology reflection",
        subject: "Biology",
        dueDate: today,
        effort: "low",
        estimatedMinutes: 5,
        plannedDate: today,
      },
      {
        id: "demo-biology-reflection",
        name: "Biology lab reflection",
        subject: "Biology",
        dueDate: shiftDateKey(today, 1),
        effort: "medium",
        estimatedMinutes: 20,
        plannedDate: today,
      },
      {
        id: "demo-history-essay",
        name: "Draft the history essay opening",
        subject: "History",
        dueDate: shiftDateKey(today, 5),
        effort: "high",
        estimatedMinutes: 30,
        plannedDate: today,
      },
      {
        id: "demo-anatomy-notes",
        name: "Review anatomy lecture notes",
        subject: "Anatomy",
        dueDate: shiftDateKey(today, 3),
        effort: "medium",
        estimatedMinutes: 15,
        plannedDate: today,
      },
    ],
    symptoms: [
      {
        id: "demo-fatigue-early",
        symptom: "Fatigue",
        severity: 2,
        note: "Needed a slower morning.",
        date: days[2],
        loggedAt: `${days[2]}T09:15:00`,
      },
      {
        id: "demo-headache",
        symptom: "Headache",
        severity: 2,
        note: "",
        date: days[3],
        loggedAt: `${days[3]}T13:00:00`,
      },
      {
        id: "demo-fatigue-crash",
        symptom: "Fatigue",
        severity: 4,
        note: "More tired the day after a full study day.",
        date: days[5],
        loggedAt: `${days[5]}T10:30:00`,
      },
      {
        id: "demo-brain-fog-crash",
        symptom: "Brain fog",
        severity: 4,
        note: "",
        date: days[5],
        loggedAt: `${days[5]}T10:35:00`,
      },
      {
        id: "demo-fatigue-today",
        symptom: "Fatigue",
        severity: 2,
        note: "",
        date: today,
        loggedAt: `${today}T09:00:00`,
      },
    ],
    customSymptoms: [],
    energyHistory: days.map((date, index) => ({ date, level: dayLevels[index] })),
  }
}

function isEnergyLevel(value: unknown): value is EnergyLevel {
  return value === "drained" || value === "low" || value === "okay" || value === "charged"
}

function isEffortLevel(value: unknown): value is EffortLevel {
  return value === "low" || value === "medium" || value === "high"
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

    const tasks = candidate.tasks.filter((task): task is PaceTask => {
      if (!task || typeof task !== "object") return false
      return Boolean(
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

    return {
      version: 2,
      energy: candidate.energy,
      tasks,
      symptoms,
      customSymptoms: candidate.customSymptoms.filter((item): item is string => typeof item === "string"),
      energyHistory,
    }
  } catch {
    return null
  }
}
