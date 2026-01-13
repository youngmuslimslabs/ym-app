"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { calculateProgress } from "./constants"
import { fetchSubregions, fetchAllNeighborNets, type Subregion, type NeighborNet } from "@/lib/supabase/queries/location"

export default function Step2() {
  const router = useRouter()
  const { data, updateData, saveStepData, isSaving, isLoading } = useOnboarding()

  const [subregionId, setSubregionId] = useState(data.subregionId ?? "")
  const [neighborNetId, setNeighborNetId] = useState(data.neighborNetId ?? "")
  const [saveError, setSaveError] = useState<string | null>(null)

  // Fetch location data from Supabase
  const [subregions, setSubregions] = useState<Subregion[]>([])
  const [allNeighborNets, setAllNeighborNets] = useState<NeighborNet[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Fetch subregions and neighbor nets on mount
  useEffect(() => {
    const loadLocationData = async () => {
      setIsLoadingData(true)
      setLoadError(null)

      const [subregionsResult, neighborNetsResult] = await Promise.all([
        fetchSubregions(),
        fetchAllNeighborNets(),
      ])

      if (subregionsResult.error) {
        setLoadError(subregionsResult.error)
        setIsLoadingData(false)
        return
      }

      if (neighborNetsResult.error) {
        setLoadError(neighborNetsResult.error)
        setIsLoadingData(false)
        return
      }

      setSubregions(subregionsResult.data || [])
      setAllNeighborNets(neighborNetsResult.data || [])
      setIsLoadingData(false)
    }

    loadLocationData()
  }, [])

  // Sync state when data loads from Supabase (pre-fill)
  useEffect(() => {
    if (data.subregionId) setSubregionId(data.subregionId)
    if (data.neighborNetId) setNeighborNetId(data.neighborNetId)
  }, [data.subregionId, data.neighborNetId])

  const progressPercentage = calculateProgress(2)

  // Get available NeighborNets based on selected subregion
  const availableNeighborNets = subregionId
    ? allNeighborNets.filter(nn => nn.subregion_id === subregionId)
    : []

  // Validation: both fields required
  const isValid = subregionId !== "" && neighborNetId !== ""

  const handleSubregionChange = (value: string) => {
    setSubregionId(value)
    // Reset NeighborNet when subregion changes
    setNeighborNetId("")
  }

  const handleBack = () => {
    updateData({ subregionId, neighborNetId })
    router.push("/onboarding?step=1")
  }

  const handleNext = async () => {
    setSaveError(null)
    const stepData = { subregionId, neighborNetId }

    updateData(stepData)
    const result = await saveStepData(2, stepData)
    if (!result.success) {
      setSaveError(result.error || "Failed to save. Please try again.")
      return
    }

    router.push("/onboarding?step=3")
  }

  // Show loading state while fetching location data
  if (isLoadingData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading locations...</p>
      </div>
    )
  }

  // Show error state if data failed to load
  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center max-w-md">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
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
            Where are you located?
          </h1>
          <p className="mt-3 text-muted-foreground">
            Select your subregion and NeighborNet
          </p>
        </div>

        {/* Form Fields */}
        <div className="flex w-full max-w-md flex-col gap-5">
          {/* Subregion */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subregion">Subregion</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select value={subregionId} onValueChange={handleSubregionChange}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select your subregion" />
                </SelectTrigger>
                <SelectContent>
                  {subregions.map((subregion) => (
                    <SelectItem key={subregion.id} value={subregion.id}>
                      {subregion.name}
                      {subregion.regions?.name && ` (${subregion.regions.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* NeighborNet */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="neighborNet">NeighborNet</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={neighborNetId}
                onValueChange={setNeighborNetId}
                disabled={!subregionId}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue
                    placeholder={
                      subregionId
                        ? "Select your NeighborNet"
                        : "Select a subregion first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableNeighborNets.map((nn) => (
                    <SelectItem key={nn.id} value={nn.id}>
                      {nn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        <Button variant="outline" onClick={handleBack} disabled={isSaving} className="w-40">
          Back
        </Button>
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
