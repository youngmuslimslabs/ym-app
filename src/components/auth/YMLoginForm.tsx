import Image from "next/image"
import GoogleSignInButton from "@/components/auth/GoogleSignInButton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"

interface YMLoginFormProps {
  onSuccess: () => void | boolean | Promise<void | boolean>
  onError: (error: string) => void
  error: string | null
}

export function YMLoginForm({ onSuccess, onError, error }: YMLoginFormProps) {
  return (
    <Card className="bg-card/75 backdrop-blur-xl border-border shadow-lg p-6 animate-[loginCardEntry_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-6">
          {/* Logo & Title */}
          <div className="flex flex-col items-center gap-2 animate-[loginFadeUp_0.5s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]">
            <div className="flex flex-col items-center gap-2 font-medium">
              <div className="relative">
                <div className="absolute inset-[-6px] rounded-[calc(var(--radius)+4px)] bg-primary/10 blur-[10px] -z-10" />
                <Image
                  src="/favicon.ico"
                  alt="Young Muslims"
                  width={48}
                  height={48}
                  className="rounded"
                  priority
                />
              </div>
            </div>
            <h1 className="text-xl font-bold text-center">Welcome to <br className="sm:hidden" />Young Muslims App</h1>
          </div>

          {/* Google Sign In Button - Full Width & Centered */}
          <div className="w-full animate-[loginFadeUp_0.5s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]">
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
        <div className="text-balance text-center text-xs text-muted-foreground animate-[loginFadeUp_0.5s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]">
          By clicking continue, you agree to our{' '}
          <a href="/legal-lol" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/legal-lol" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>.
        </div>
      </div>
    </Card>
  )
}
