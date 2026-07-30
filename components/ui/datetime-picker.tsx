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

// Helper to extract WIB wall-clock components from a UTC Date
const getWIBParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hours: Number(get("hour")) % 24, // Intl can return "24" for midnight
    minutes: Number(get("minute")),
  }
}

// Helper to build a "fake local" Date object whose LOCAL getter values equal WIB wall-clock numbers
const wibPartsToFakeLocalDate = (parts: {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
}) => new Date(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes)

// Helper to convert WIB wall-clock components to true UTC ISO string
const wibPartsToUTCISOString = (
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
) => {
  const pad = (n: number) => String(n).padStart(2, "0")
  // Explicit +07:00 offset - JS correctly converts this to true UTC
  // regardless of what timezone the system/browser is actually running in.
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+07:00`
  ).toISOString()
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Plain WIB wall-clock state - initialized once from UTC value
  const [wibYear, setWibYear] = React.useState<number>()
  const [wibMonth, setWibMonth] = React.useState<number>()
  const [wibDay, setWibDay] = React.useState<number>()
  const [hours, setHours] = React.useState(0)
  const [minutes, setMinutes] = React.useState(0)

  // Sync WIB state when value prop changes
  React.useEffect(() => {
    if (value) {
      const utcDate = new Date(value)
      const wibParts = getWIBParts(utcDate)
      setWibYear(wibParts.year)
      setWibMonth(wibParts.month)
      setWibDay(wibParts.day)
      setHours(wibParts.hours)
      setMinutes(wibParts.minutes)
    } else {
      setWibYear(undefined)
      setWibMonth(undefined)
      setWibDay(undefined)
      setHours(0)
      setMinutes(0)
    }
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Read clicked day numbers directly from local getters - these represent
      // the literal calendar day the user clicked, regardless of system timezone
      const newYear = selectedDate.getFullYear()
      const newMonth = selectedDate.getMonth() + 1
      const newDay = selectedDate.getDate()
      setWibYear(newYear)
      setWibMonth(newMonth)
      setWibDay(newDay)
      onChange(
        wibPartsToUTCISOString(newYear, newMonth, newDay, hours, minutes)
      )
    }
  }

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours)
    setMinutes(newMinutes)
    if (wibYear && wibMonth && wibDay) {
      onChange(
        wibPartsToUTCISOString(wibYear, wibMonth, wibDay, newHours, newMinutes)
      )
    }
  }

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return placeholder
    const utcDate = new Date(dateString)
    if (!utcDate) return placeholder
    // Convert UTC to WIB for display (already correct)
    return utcDate.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
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
              wibYear && wibMonth && wibDay
                ? wibPartsToFakeLocalDate({ year: wibYear, month: wibMonth, day: wibDay, hours, minutes })
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
