'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface BaseProps {
  label: string
  icon?: ReactNode
  className?: string
  disabled?: boolean
}

interface TextFieldProps extends BaseProps {
  type: 'text' | 'email' | 'tel'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  formatter?: (value: string) => string
  validator?: (value: string) => boolean
}

interface SelectFieldProps extends BaseProps {
  type: 'select'
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

interface DateFieldProps extends BaseProps {
  type: 'date'
  value: Date | undefined
  onChange: (value: Date | undefined) => void
  placeholder?: string
}

type InlineEditFieldProps = TextFieldProps | SelectFieldProps | DateFieldProps

export function InlineEditField(props: InlineEditFieldProps) {
  const { label, icon, className, disabled = false } = props
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState<string | Date | undefined>(
    props.type === 'date' ? props.value : props.value
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Reset temp value when props change
  const propsValue = props.value
  const propsType = props.type
  useEffect(() => {
    setTempValue(propsType === 'date' ? propsValue : propsValue)
  }, [propsValue, propsType])

  const handleConfirm = () => {
    if (props.type === 'text' || props.type === 'email' || props.type === 'tel') {
      props.onChange(tempValue as string)
    } else if (props.type === 'select') {
      props.onChange(tempValue as string)
    } else if (props.type === 'date') {
      props.onChange(tempValue as Date | undefined)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(props.type === 'date' ? props.value : props.value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  // Display value formatting
  const getDisplayValue = (): string => {
    if (props.type === 'date') {
      return props.value ? format(props.value, 'MMMM d, yyyy') : ''
    }
    if (props.type === 'select') {
      const option = props.options.find(o => o.value === props.value)
      return option?.label ?? ''
    }
    return props.value || ''
  }

  const displayValue = getDisplayValue()
  const isEmpty = !displayValue

  if (disabled) {
    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        <Label className="text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-md border border-input">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-foreground">{displayValue}</span>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-1.5', className)}>
      <Label>{label}</Label>

      {!isEditing ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={cn(
            'group w-full flex items-center gap-2 py-2 px-3 rounded-md border transition-all duration-200 text-left',
            'border-input hover:border-ring hover:bg-accent/50',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isEmpty && 'text-muted-foreground'
          )}
        >
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          <span className="flex-1 truncate">
            {isEmpty ? (props.type === 'select' ? props.placeholder : 'Click to add') : displayValue}
          </span>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {props.type === 'text' || props.type === 'email' || props.type === 'tel' ? (
            <>
              <div className="relative flex-1">
                {icon && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {icon}
                  </span>
                )}
                <Input
                  ref={inputRef}
                  type={props.type}
                  value={tempValue as string}
                  onChange={(e) => {
                    const val = props.formatter ? props.formatter(e.target.value) : e.target.value
                    setTempValue(val)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={props.placeholder}
                  className={cn(icon && 'pl-10')}
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleConfirm}
                className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleCancel}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : props.type === 'select' ? (
            <>
              <Select
                value={tempValue as string}
                onValueChange={(val) => {
                  setTempValue(val)
                  props.onChange(val)
                  setIsEditing(false)
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={props.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {props.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleCancel}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : props.type === 'date' ? (
            <Popover open onOpenChange={(open) => !open && handleCancel()}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {tempValue ? format(tempValue as Date, 'PPP') : props.placeholder || 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tempValue as Date | undefined}
                  onSelect={(date) => {
                    setTempValue(date)
                    props.onChange(date)
                    setIsEditing(false)
                  }}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={1940}
                  toYear={new Date().getFullYear() - 10}
                />
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
      )}
    </div>
  )
}
