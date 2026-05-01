import { getFirstName } from '@/lib/utils/getFirstName'

interface GreetingProps {
  fullName: string
}

export function Greeting({ fullName }: GreetingProps) {
  const firstName = getFirstName(fullName)
  return (
    <h1 className="text-[clamp(2.5rem,5.5vw,3.5rem)] font-medium leading-[1.05] tracking-tight">
      Assalamu alaykum,
      <br />
      <span className="text-primary">{firstName}.</span>
    </h1>
  )
}
