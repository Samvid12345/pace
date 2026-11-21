"use client"

import type { CompletionFeeling } from "@/components/pace-data"

interface PaceTaskReflectionProps {
  taskName: string
  onChoose: (feeling: CompletionFeeling) => void
  onSkip: () => void
}

const choices: Array<{ value: CompletionFeeling; label: string; detail: string }> = [
  { value: "easier", label: "Easier", detail: "That took less out of me." },
  { value: "expected", label: "As expected", detail: "About what I thought." },
  { value: "harder", label: "Harder", detail: "That took more out of me." },
]

export function PaceTaskReflection({ taskName, onChoose, onSkip }: PaceTaskReflectionProps) {
  return (
    <div className="reflection-backdrop">
      <section className="reflection-dialog" role="dialog" aria-modal="true" aria-labelledby="reflection-heading">
        <p className="section-kicker">A QUICK CHECK-IN</p>
        <h2 id="reflection-heading">How did that really go?</h2>
        <p className="reflection-task-name">{taskName}</p>
        <div className="reflection-choices">
          {choices.map(({ value, label, detail }) => (
            <button autoFocus={value === "easier"} key={value} type="button" onClick={() => onChoose(value)}>
              <strong>{label}</strong><span>{detail}</span>
            </button>
          ))}
        </div>
        <button className="reflection-skip" type="button" onClick={onSkip}>Skip for now</button>
      </section>
    </div>
  )
}
