import { Logo } from "@/components/brand/logo"
import { BrandBlob, BrandWave } from "@/components/brand/blob"
import GoogleSignInButton from "@/components/auth/GoogleSignInButton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface YMLoginFormProps {
  onSuccess: () => void | boolean | Promise<void | boolean>
  onError: (error: string) => void
  error: string | null
}

const ENTER = "animate-[loginFadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none"

/**
 * Login screen. A big brand colour block carries the headline (Brandbook
 * p.14, 35); the sign-in panel sits beside it on wide screens and below it on
 * phones. Colours come from the theme tokens, so it is General for a signed-out
 * visitor and picks up a side if a returning member's cookie is still set.
 */
export function YMLoginForm({ onSuccess, onError, error }: YMLoginFormProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      {/* Brand block */}
      <section className="relative isolate flex flex-col overflow-hidden bg-primary text-primary-foreground lg:min-h-dvh lg:flex-1">
        <BrandBlob
          shape="ripple"
          rotate={-18}
          className="absolute -bottom-40 -left-32 -z-10 size-[26rem] text-white/[0.07] lg:-bottom-56 lg:-left-40 lg:size-[44rem]"
        />
        <BrandBlob
          shape="cloud"
          rotate={30}
          className="absolute -right-24 -top-28 -z-10 size-72 text-white/[0.06] lg:size-[32rem]"
        />
        <BrandBlob
          shape="pebble"
          rotate={12}
          className="absolute -bottom-4 right-8 -z-10 size-24 text-highlight lg:bottom-24 lg:right-16 lg:size-40"
        />

        <div className="flex flex-1 flex-col gap-10 px-6 pb-16 pt-safe sm:px-10 lg:justify-between lg:p-14 xl:p-20">
          <Logo variant="full" className="mt-8 h-5 max-w-[16rem] lg:mt-0 lg:h-6" />

          <div className={`max-w-xl space-y-5 ${ENTER}`}>
            <h1 className="ym-display">
              For the youth.
              <br />
              By the youth.
            </h1>
            <p className="max-w-md text-pretty text-lg text-primary-foreground/80">
              Your Neighbor Net, your people and your next event, all in one place.
            </p>
          </div>

          <p className="ym-eyebrow hidden text-primary-foreground/60 lg:block">
            Brotherhood · Sisterhood · Deen
          </p>
        </div>

        {/* Phones: the block ends in a soft wave into the sign-in panel */}
        <BrandWave className="-mb-px h-8 text-background lg:hidden" />
      </section>

      {/* Sign-in panel */}
      <section className="flex flex-1 items-start justify-center px-6 pb-12 pt-4 sm:px-10 lg:max-w-[34rem] lg:items-center lg:py-14">
        <div className={`flex w-full max-w-sm flex-col gap-8 [animation-delay:120ms] ${ENTER}`}>
          <div className="space-y-2">
            <p className="ym-eyebrow text-primary">Young Muslims App</p>
            <h2 className="ym-h1">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in with your youngmuslims.com Google account.
            </p>
          </div>

          <div className="space-y-4">
            <GoogleSignInButton onSuccess={onSuccess} onError={onError} />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <p className="text-pretty text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="/legal-lol" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/legal-lol" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
