import { GalleryVerticalEnd } from "lucide-react"
import GoogleSignInButton from "@/components/auth/GoogleSignInButton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface YMLoginFormProps {
  onSuccess: () => void
  onError: (error: string) => void
  error: string | null
}

export function YMLoginForm({ onSuccess, onError, error }: YMLoginFormProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <div className="flex flex-col gap-6">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center gap-2 font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-6" />
            </div>
            <span className="sr-only">Young Muslims App</span>
          </div>
          <h1 className="text-xl font-bold">Welcome to Young Muslims App</h1>
        </div>

        {/* Google Sign In Button - Full Width & Centered */}
        <div className="w-full">
          <GoogleSignInButton
            onSuccess={onSuccess}
            onError={onError}
          />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Footer */}
      <div className="text-balance text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our{' '}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>.
      </div>
    </div>
  )
}
