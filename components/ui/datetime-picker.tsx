"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CalendarIcon, Clock } from "lucide-react"

interface DateTimePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// Helper to format date parts as plain ISO string (no timezone conversion)
const formatToISOString = (
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
) => {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`
}

// Helper to parse ISO string to date parts (no timezone conversion)
const parseISOString = (isoString: string) => {
  const date = new Date(isoString)
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
  }
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Plain date/time state - initialized once from value
  const [year, setYear] = React.useState<number>()
  const [month, setMonth] = React.useState<number>()
  const [day, setDay] = React.useState<number>()
  const [hours, setHours] = React.useState(0)
  const [minutes, setMinutes] = React.useState(0)

  // Sync state when value prop changes
  React.useEffect(() => {
    if (value) {
      const parts = parseISOString(value)
      setYear(parts.year)
      setMonth(parts.month)
      setDay(parts.day)
      setHours(parts.hours)
      setMinutes(parts.minutes)
    } else {
      setYear(undefined)
      setMonth(undefined)
      setDay(undefined)
      setHours(0)
      setMinutes(0)
    }
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newYear = selectedDate.getFullYear()
      const newMonth = selectedDate.getMonth() + 1
      const newDay = selectedDate.getDate()
      setYear(newYear)
      setMonth(newMonth)
      setDay(newDay)
      onChange(
        formatToISOString(newYear, newMonth, newDay, hours, minutes)
      )
    }
  }

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours)
    setMinutes(newMinutes)
    if (year && month && day) {
      onChange(
        formatToISOString(year, month, day, newHours, newMinutes)
      )
    }
  }

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return placeholder
    const date = new Date(dateString)
    if (!date) return placeholder
    // Display as-is (no timezone conversion)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateTime(value)}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={
              year && month && day
                ? new Date(year, month - 1, day)
                : undefined
            }
            onSelect={handleDateSelect}
          />
          <div className="flex items-center gap-2 pt-2 border-t">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                min="0"
                max="23"
                value={hours.toString().padStart(2, "0")}
                onChange={(e) => {
                  const h = parseInt(e.target.value) || 0
                  const validHours = Math.min(23, Math.max(0, h))
                  handleTimeChange(validHours, minutes)
                }}
                className="w-16 text-center"
              />
              <span className="text-muted-foreground">:</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={minutes.toString().padStart(2, "0")}
                onChange={(e) => {
                  const m = parseInt(e.target.value) || 0
                  const validMinutes = Math.min(59, Math.max(0, m))
                  handleTimeChange(hours, validMinutes)
                }}
                className="w-16 text-center"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
