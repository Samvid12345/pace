import { BatteryCharging, Heart } from "lucide-react"
import { effortPoints, isCompleteToday, type PaceTask } from "@/components/pace-data"
import type { EnergyLevel } from "@/components/pace-energy-picker"

interface PacePacingSummaryProps {
  tasks: PaceTask[]
  energy: EnergyLevel
  guardActive: boolean
  today: string
}

function getSafeLimit(energy: EnergyLevel, guardActive: boolean) {
  if (energy === "drained") return 0
  if (guardActive) return 15
  if (energy === "low") return 30
  if (energy === "okay") return 50
  return 70
}

export function PacePacingSummary({ tasks, energy, guardActive, today }: PacePacingSummaryProps) {
  const used = tasks.reduce((sum, task) => {
    return isCompleteToday(task, today) ? sum + effortPoints(task.effort) : sum
  }, 0)
  const safeLimit = getSafeLimit(energy, guardActive)
  const barPercent = safeLimit === 0 ? (used > 0 ? 100 : 0) : Math.min(100, Math.round((used / safeLimit) * 100))
  const overLimit = used > safeLimit

  return (
    <section className={`pacing-summary${guardActive ? " is-guarded" : ""}`} aria-labelledby="pacing-summary-heading">
      <div className="pacing-summary-top">
        <span className="pacing-icon"><BatteryCharging aria-hidden="true" /></span>
        <div className="pacing-summary-copy">
          <p className="section-kicker">A SOFT STOPPING POINT</p>
          <h2 id="pacing-summary-heading">Your pacing estimate</h2>
        </div>
        <span className="pacing-heart"><Heart aria-hidden="true" /></span>
      </div>
      <div className="pacing-meter-copy">
        <strong>{used} <span>used</span></strong>
        <span>{safeLimit === 0 ? "Rest is the limit today" : `of about ${safeLimit} energy points`}</span>
      </div>
      <div
        className="pacing-meter"
        role="progressbar"
        aria-label="Estimated energy used today"
        aria-valuemin={0}
        aria-valuemax={Math.max(safeLimit, 1)}
        aria-valuenow={used > safeLimit ? Math.max(safeLimit, 1) : used}
        aria-valuetext={`${used} estimated energy points used${safeLimit === 0 ? "; rest is the limit" : `, soft limit ${safeLimit}`}`}
      >
        <span className="pacing-meter-fill" style={{ width: `${barPercent}%` }} />
      </div>
      <p className="pacing-summary-note">
        {overLimit
          ? "You’ve already done a lot. Stopping here is completely okay."
          : safeLimit === 0
            ? "You don’t need to spend energy on school today."
            : guardActive
              ? "We’ve made today smaller. The numbers are only a gentle guide."
              : "A rough planning guide, not a measure of your body."}
      </p>
    </section>
  )
}
