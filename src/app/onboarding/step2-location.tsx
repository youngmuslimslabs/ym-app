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

// TODO: Fetch from Supabase - these are placeholder values
const SUBREGIONS = [
  { id: "houston", name: "Houston", regionName: "Texas" },
  { id: "dallas", name: "Dallas", regionName: "Texas" },
  { id: "austin", name: "Austin", regionName: "Texas" },
  { id: "nyc-east", name: "NYC East", regionName: "New York" },
  { id: "nyc-west", name: "NYC West", regionName: "New York" },
  { id: "la-central", name: "LA Central", regionName: "California" },
  { id: "la-south", name: "LA South", regionName: "California" },
  { id: "chicago", name: "Chicago", regionName: "Midwest" },
]

// TODO: Fetch from Supabase - these are placeholder values
// NeighborNets are filtered by subregion_id
const NEIGHBOR_NETS: Record<string, { id: string; name: string }[]> = {
  houston: [
    { id: "katy-nn", name: "Katy NN" },
    { id: "sugar-land-nn", name: "Sugar Land NN" },
    { id: "downtown-houston-nn", name: "Downtown Houston NN" },
  ],
  dallas: [
    { id: "plano-nn", name: "Plano NN" },
    { id: "irving-nn", name: "Irving NN" },
    { id: "richardson-nn", name: "Richardson NN" },
  ],
  austin: [
    { id: "ut-austin-nn", name: "UT Austin NN" },
    { id: "round-rock-nn", name: "Round Rock NN" },
  ],
  "nyc-east": [
    { id: "queens-nn", name: "Queens NN" },
    { id: "brooklyn-nn", name: "Brooklyn NN" },
  ],
  "nyc-west": [
    { id: "manhattan-nn", name: "Manhattan NN" },
    { id: "jersey-city-nn", name: "Jersey City NN" },
  ],
  "la-central": [
    { id: "downtown-la-nn", name: "Downtown LA NN" },
    { id: "pasadena-nn", name: "Pasadena NN" },
  ],
  "la-south": [
    { id: "irvine-nn", name: "Irvine NN" },
    { id: "anaheim-nn", name: "Anaheim NN" },
  ],
  chicago: [
    { id: "north-chicago-nn", name: "North Chicago NN" },
    { id: "south-chicago-nn", name: "South Chicago NN" },
  ],
}

export default function Step2() {
  const router = useRouter()
  const { data, updateData, saveStepData, isSaving, isLoading } = useOnboarding()

  const [subregionId, setSubregionId] = useState(data.subregionId ?? "")
  const [neighborNetId, setNeighborNetId] = useState(data.neighborNetId ?? "")
  const [saveError, setSaveError] = useState<string | null>(null)

  // Sync state when data loads from Supabase (pre-fill)
  useEffect(() => {
    if (data.subregionId) setSubregionId(data.subregionId)
    if (data.neighborNetId) setNeighborNetId(data.neighborNetId)
  }, [data.subregionId, data.neighborNetId])

  const progressPercentage = calculateProgress(2)

  // Get available NeighborNets based on selected subregion
  const availableNeighborNets = subregionId ? NEIGHBOR_NETS[subregionId] || [] : []

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
                  {SUBREGIONS.map((subregion) => (
                    <SelectItem key={subregion.id} value={subregion.id}>
                      {subregion.name} ({subregion.regionName})
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
