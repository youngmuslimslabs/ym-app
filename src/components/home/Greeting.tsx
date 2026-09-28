import { getFirstName } from '@/lib/utils/getFirstName'

interface GreetingProps {
  fullName: string
}

/** The salam line and the member's first name, set as the page's display headline. */
export function Greeting({ fullName }: GreetingProps) {
  const firstName = getFirstName(fullName)
  return (
    <h1>
      <span className="ym-eyebrow block text-sm text-brand-snow/65">Assalamu alaykum,</span>
      <span className="ym-display mt-1 block break-words">{firstName}.</span>
    </h1>
  )
}
