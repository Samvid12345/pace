"use client"

import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react"

export type EnergyLevel = "drained" | "low" | "okay" | "charged"

const energyChoices = [
  { value: "drained", label: "Drained", icon: BatteryLow },
  { value: "low", label: "Low", icon: BatteryLow },
  { value: "okay", label: "Okay", icon: BatteryMedium },
  { value: "charged", label: "Charged", icon: BatteryFull },
] as const

interface PaceEnergyPickerProps {
  value: EnergyLevel
  onChange: (value: EnergyLevel) => void
}

export function PaceEnergyPicker({ value, onChange }: PaceEnergyPickerProps) {
  return (
    <div className="energy-options" role="group" aria-label="Choose your energy level">
      {energyChoices.map(({ value: level, label, icon: Icon }) => {
        const isSelected = value === level

        return (
          <button
            key={level}
            type="button"
            className={`energy-option${isSelected ? " is-selected" : ""}`}
            aria-pressed={isSelected}
            onClick={() => onChange(level)}
          >
            <span className="energy-icon-wrap" aria-hidden="true">
              <Icon className="energy-icon" strokeWidth={1.8} />
            </span>
            <span className="energy-label">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
