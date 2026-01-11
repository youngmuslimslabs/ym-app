"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar as CalendarIcon, Globe, Loader2, Mail, Phone } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { calculateProgress } from "./constants"

// Common ethnicities - can be expanded as needed
const ETHNICITIES = [
  "Afghan",
  "Algerian",
  "Bangladeshi",
  "Egyptian",
  "Emirati",
  "Ethiopian",
  "Indian",
  "Indonesian",
  "Iranian",
  "Iraqi",
  "Jordanian",
  "Kuwaiti",
  "Lebanese",
  "Libyan",
  "Malaysian",
  "Moroccan",
  "Nigerian",
  "Pakistani",
  "Palestinian",
  "Saudi",
  "Somali",
  "Sudanese",
  "Syrian",
  "Tunisian",
  "Turkish",
  "Yemeni",
  "Other",
] as const

// Format phone number as user types: (555) 123-4567
function formatPhoneNumber(value: string): string {
  // Strip all non-digits
  const digits = value.replace(/\D/g, "")

  // Limit to 10 digits
  const limited = digits.slice(0, 10)

  // Format based on length
  if (limited.length === 0) return ""
  if (limited.length <= 3) return `(${limited}`
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
}

// Basic email validation: has @ and domain with TLD
function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

// Check if phone has 10 digits
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "")
  return digits.length === 10
}

export default function PersonalInfo() {
  const router = useRouter()
  const { data, updateData, saveStepData, isSaving, isLoading } = useOnboarding()

  // Initialize from context (supports back navigation and pre-fill)
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber ?? "")
  const [personalEmail, setPersonalEmail] = useState(data.personalEmail ?? "")
  const [ethnicity, setEthnicity] = useState(data.ethnicity ?? "")
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(data.dateOfBirth)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Sync state when data loads from Supabase (pre-fill)
  useEffect(() => {
    if (data.phoneNumber) setPhoneNumber(data.phoneNumber)
    if (data.personalEmail) setPersonalEmail(data.personalEmail)
    if (data.ethnicity) setEthnicity(data.ethnicity)
    if (data.dateOfBirth) setDateOfBirth(data.dateOfBirth)
  }, [data.phoneNumber, data.personalEmail, data.ethnicity, data.dateOfBirth])

  // Track which fields have been touched (blurred)
  const [touched, setTouched] = useState({
    phone: false,
    email: false,
  })

  const progressPercentage = calculateProgress(1)

  // Handle phone input with auto-formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  // Mark field as touched on blur
  const handleBlur = (field: "phone" | "email") => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Determine error states (only show if touched and invalid)
  const phoneError = touched.phone && phoneNumber.length > 0 && !isValidPhone(phoneNumber)
  const emailError = touched.email && personalEmail.length > 0 && !isValidEmail(personalEmail)

  // Validation: all fields required with format checks
  const isValid = isValidPhone(phoneNumber) &&
                  isValidEmail(personalEmail) &&
                  ethnicity !== "" &&
                  dateOfBirth !== undefined

  const handleNext = async () => {
    setSaveError(null)
    const stepData = { phoneNumber, personalEmail, ethnicity, dateOfBirth }

    // Update context and save to Supabase
    updateData(stepData)
    const result = await saveStepData(1, stepData)
    if (!result.success) {
      setSaveError(result.error || "Failed to save. Please try again.")
      return
    }

    router.push("/onboarding?step=2")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      {/* Progress Bar */}
      <div className="w-full">
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-12">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Welcome! Let&apos;s get started
          </h1>
          <p className="mt-3 text-muted-foreground">
            First, tell us a bit about yourself
          </p>
        </div>

        {/* Form Fields */}
        <div className="flex w-full max-w-md flex-col gap-5">
          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className={cn(
                "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                phoneError ? "text-destructive" : "text-muted-foreground"
              )} />
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={handlePhoneChange}
                onBlur={() => handleBlur("phone")}
                aria-invalid={phoneError}
                aria-describedby={phoneError ? "phone-error" : undefined}
                className={cn(
                  "pl-10",
                  phoneError && "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>
            {phoneError && (
              <p id="phone-error" className="text-sm text-destructive">
                Please enter a valid 10-digit phone number
              </p>
            )}
          </div>

          {/* Personal Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personalEmail">Personal Email</Label>
            <div className="relative">
              <Mail className={cn(
                "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                emailError ? "text-destructive" : "text-muted-foreground"
              )} />
              <Input
                id="personalEmail"
                type="email"
                placeholder="you@example.com"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                aria-invalid={emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                className={cn(
                  "pl-10",
                  emailError && "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>
            {emailError && (
              <p id="email-error" className="text-sm text-destructive">
                Please enter a valid email address
              </p>
            )}
          </div>

          {/* Ethnicity */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ethnicity">Ethnicity</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select value={ethnicity} onValueChange={setEthnicity}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select your ethnicity" />
                </SelectTrigger>
                <SelectContent>
                  {ETHNICITIES.map((eth) => (
                    <SelectItem key={eth} value={eth.toLowerCase()}>
                      {eth}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="flex flex-col gap-1.5">
            <Label>Date of Birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateOfBirth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateOfBirth ? format(dateOfBirth, "PPP") : "Select your date of birth"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateOfBirth}
                  onSelect={setDateOfBirth}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={1940}
                  toYear={new Date().getFullYear() - 10}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="mb-4 w-full max-w-md mx-auto rounded-md bg-destructive/10 p-4 text-center text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex w-full items-center justify-center gap-4 pb-4">
        {/* No previous button for first step */}
        <Button onClick={handleNext} disabled={!isValid || isSaving || isLoading} className="w-40">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  )
}

