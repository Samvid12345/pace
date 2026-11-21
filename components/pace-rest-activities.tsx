"use client"

import { Check, Plus } from "lucide-react"
import { restActivities, type RestActivityType, type RestEntry } from "@/components/pace-data"

interface PaceRestActivitiesProps {
  activities: RestEntry[]
  today: string
  onAdd: (activity: RestActivityType, points: number) => void
}

export function PaceRestActivities({ activities, today, onAdd }: PaceRestActivitiesProps) {
  const todaysActivities = activities.filter((entry) => entry.date === today)
  const restored = todaysActivities.reduce((sum, entry) => sum + entry.points, 0)

  return (
    <section className="rest-activities-card" aria-labelledby="rest-activities-heading">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">REST COUNTS, TOO</p>
          <h2 id="rest-activities-heading">A little recharge</h2>
        </div>
        <span className="rest-gain">+{restored} today</span>
      </div>
      <p className="section-intro">Choose a pause to add energy back to today&apos;s meter. Only what feels right.</p>
      <div className="rest-activity-options">
        {restActivities.map(({ type, label, points, detail }) => {
          const added = todaysActivities.some((entry) => entry.activity === type)
          return (
            <button className="rest-activity-option" type="button" key={type} disabled={added} aria-pressed={added} onClick={() => onAdd(type, points)}>
              <span className="rest-activity-copy"><strong>{label}</strong><small>{detail}</small></span>
              <span className="rest-activity-points">{added ? <Check aria-label="Added" /> : <><Plus aria-hidden="true" /> +{points}</>}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
