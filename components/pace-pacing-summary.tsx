import { BatteryCharging, Heart } from "lucide-react"
import { getDailyEnergyLimit, getDailyEnergyUsage, type PaceTask, type RestEntry, type TaskReview } from "@/components/pace-data"
import type { EnergyLevel } from "@/components/pace-energy-picker"

interface PacePacingSummaryProps {
  tasks: PaceTask[]
  energy: EnergyLevel
  guardActive: boolean
  today: string
  safeDailyLimit: number
  reviews: TaskReview[]
  restActivities: RestEntry[]
}

export function PacePacingSummary({ tasks, energy, guardActive, today, safeDailyLimit, reviews, restActivities }: PacePacingSummaryProps) {
  const { used, restored } = getDailyEnergyUsage(tasks, reviews, restActivities, today)
  const safeLimit = getDailyEnergyLimit(energy, guardActive, safeDailyLimit)
  const barPercent = safeLimit === 0 ? (restored > 0 ? 100 : 0) : Math.min(100, Math.round((used / safeLimit) * 100))
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
        <span>of about {safeLimit} energy points</span>
      </div>
      <div
        className="pacing-meter"
        role="progressbar"
        aria-label="Estimated net energy used today"
        aria-valuemin={0}
        aria-valuemax={Math.max(safeLimit, 1)}
        aria-valuenow={used > safeLimit ? Math.max(safeLimit, 1) : used}
        aria-valuetext={`${used} estimated energy points used after ${restored} restored from rest, soft limit ${safeLimit}`}
      >
        <span className="pacing-meter-fill" style={{ width: `${barPercent}%` }} />
      </div>
      {restored > 0 && <p className="restored-energy-note">Rest activities returned {restored} energy points to today&apos;s meter.</p>}
      <p className="pacing-summary-note">
        {overLimit
          ? "You’ve already done a lot. Stopping here is completely okay."
          : energy === "drained"
            ? "Rest is the plan. The meter is only a gentle guide."
            : guardActive
              ? "We’ve made today smaller. The numbers are only a gentle guide."
              : "A rough planning guide, not a measure of your body."}
      </p>
    </section>
  )
}
