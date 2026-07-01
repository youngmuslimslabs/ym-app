"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"
import { usePostHog } from "posthog-js/react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { useOnboardingReference } from "@/contexts/OnboardingReferenceContext"
import {
  OnboardingLayout,
  OnboardingContent,
  OnboardingStepSkeleton,
  OnboardingErrorState,
} from "./components"

export default function Step2() {
  const router = useRouter()
  const posthog = usePostHog()
  const { data, updateData, saveStepInBackground, isLoading } = useOnboarding()
  const { subregions, neighborNets: allNeighborNets, isLoading: isLoadingData, error: loadError } = useOnboardingReference()

  const [subregionId, setSubregionId] = useState(data.subregionId ?? "")
  const [neighborNetId, setNeighborNetId] = useState(data.neighborNetId ?? "")

  // Sync state when data loads from Supabase (pre-fill)
  useEffect(() => {
    if (data.subregionId) setSubregionId(data.subregionId)
    if (data.neighborNetId) setNeighborNetId(data.neighborNetId)
  }, [data.subregionId, data.neighborNetId])

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
    const stepData = { subregionId, neighborNetId }
    updateData(stepData)
    saveStepInBackground(2, stepData)
    router.push("/onboarding?step=1")
  }

  const handleNext = () => {
    const stepData = { subregionId, neighborNetId }
    updateData(stepData)
    saveStepInBackground(2, stepData)
    posthog?.capture('onboarding_step_completed', {
      step: 2,
      step_name: 'location',
      neighbor_net_id: neighborNetId,
    })
    router.push("/onboarding?step=3")
  }

  // Show loading state while fetching location data
  if (isLoadingData) {
    return <OnboardingStepSkeleton />
  }

  // Show error state if data failed to load
  if (loadError) {
    return (
      <OnboardingErrorState
        message={loadError}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <OnboardingLayout
      step={2}
      isValid={isValid}
      isLoading={isLoading}
      onBack={handleBack}
      onNext={handleNext}
    >
      <OnboardingContent
        title="Where are you located?"
        subtitle="Select your subregion and NeighborNet"
      >
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
      </OnboardingContent>
    </OnboardingLayout>
  )
}
