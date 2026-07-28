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

// Helper to parse ISO string as WIB time
const parseWIBDate = (isoString: string | undefined): Date | undefined => {
  if (!isoString) return undefined
  const date = new Date(isoString)
  // Convert UTC to WIB by adding 7 hours
  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  return wibDate
}

// Helper to format WIB date to ISO string (stored as UTC but represents WIB time)
const formatWIBToISO = (date: Date): string => {
  // Subtract 7 hours to convert WIB to UTC for storage
  const utcDate = new Date(date.getTime() - 7 * 60 * 60 * 1000)
  return utcDate.toISOString()
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(
    parseWIBDate(value)
  )
  const [hours, setHours] = React.useState(
    parseWIBDate(value)?.getHours() || 0
  )
  const [minutes, setMinutes] = React.useState(
    parseWIBDate(value)?.getMinutes() || 0
  )

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      // Update the full datetime with current time values
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(hours)
      newDateTime.setMinutes(minutes)
      onChange(formatWIBToISO(newDateTime))
    }
  }

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours)
    setMinutes(newMinutes)
    if (date) {
      const newDateTime = new Date(date)
      newDateTime.setHours(newHours)
      newDateTime.setMinutes(newMinutes)
      onChange(formatWIBToISO(newDateTime))
    }
  }

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return placeholder
    const wibDate = parseWIBDate(dateString)
    if (!wibDate) return placeholder
    return wibDate.toLocaleString("en-US", {
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
      <PopoverTrigger>
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
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
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
