"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar as CalendarIcon, Globe, Mail, Phone } from "lucide-react"
import { format } from "date-fns"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
import { formatPhoneNumber, isValidPhone, isValidEmail } from "@/lib/validation"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { OnboardingLayout, OnboardingContent } from "./components"

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

export default function PersonalInfo() {
  const router = useRouter()
  const { data, updateData, saveStepInBackground, isLoading } = useOnboarding()

  // Initialize from context (supports back navigation and pre-fill)
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber ?? "")
  const [personalEmail, setPersonalEmail] = useState(data.personalEmail ?? "")
  const [ethnicity, setEthnicity] = useState(data.ethnicity ?? "")
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(data.dateOfBirth)

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

  const handleNext = () => {
    const stepData = { phoneNumber, personalEmail, ethnicity, dateOfBirth }
    updateData(stepData)
    saveStepInBackground(1, stepData)
    router.push("/onboarding?step=2")
  }

  return (
    <OnboardingLayout
      step={1}
      isValid={isValid}
      isLoading={isLoading}
      onNext={handleNext}
      showBack={false}
    >
      <OnboardingContent
        title="Welcome! Let's get started"
        subtitle="First, tell us a bit about yourself"
      >
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
              <Globe className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
      </OnboardingContent>
    </OnboardingLayout>
  )
}

