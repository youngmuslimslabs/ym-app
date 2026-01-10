import Image from 'next/image'

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/favicon.ico"
          alt="Young Muslims"
          width={48}
          height={48}
          className="animate-pulse"
          priority
        />
      </div>
    </div>
  )
}
