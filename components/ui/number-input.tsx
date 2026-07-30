import * as React from "react"
import { Input } from "./input"

export interface NumberInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** Allow negative numbers (default: false) */
  allowNegative?: boolean
  /** Allow decimal numbers (default: false) */
  allowDecimal?: boolean
}

function NumberInput({ 
  allowNegative = false, 
  allowDecimal = false, 
  value, 
  onChange, 
  onFocus,
  ...props 
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    
    // Allow empty string (for clearing the field)
    if (rawValue === "") {
      onChange?.(e)
      return
    }

    // Build regex based on allowed characters
    const negativePattern = allowNegative ? "-?" : ""
    const decimalPattern = allowDecimal ? `(\\.\\d*)?` : ""
    const pattern = new RegExp(`^${negativePattern}\\d+${decimalPattern}$`)
    
    // Only allow valid numeric characters
    if (!pattern.test(rawValue)) {
      return
    }

    // Strip leading zeros unless value is "0" or starts with "0."
    let processedValue = rawValue
    if (rawValue.startsWith("0") && rawValue.length > 1 && !rawValue.startsWith("0.")) {
      processedValue = rawValue.replace(/^0+/, "") || "0"
    }

    // Create a new event with the processed value
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        value: processedValue
      }
    } as React.ChangeEvent<HTMLInputElement>

    onChange?.(newEvent)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13].includes(e.keyCode)) {
      return
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
      return
    }

    // Allow: home, end, left, right arrows
    if ([35, 36, 37, 39].includes(e.keyCode)) {
      return
    }

    // Allow negative sign if allowed and at the start
    if (allowNegative && e.key === "-" && (e.target as HTMLInputElement).selectionStart === 0) {
      return
    }

    // Allow decimal point if allowed and not already present
    if (allowDecimal && e.key === ".") {
      const currentValue = (e.target as HTMLInputElement).value
      if (!currentValue.includes(".")) {
        return
      }
    }

    // Block anything that's not a digit
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Strip leading zeros on focus
    const rawValue = e.target.value
    if (rawValue.startsWith("0") && rawValue.length > 1 && !rawValue.startsWith("0.")) {
      const processedValue = rawValue.replace(/^0+/, "") || "0"
      e.target.value = processedValue
    }
    onFocus?.(e)
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      {...props}
    />
  )
}

export { NumberInput }
