import { Logo } from '@/components/brand/logo'

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-12 animate-pulse text-primary" />
      </div>
    </div>
  )
}
