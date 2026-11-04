import { redirect } from 'next/navigation'

// Compatibility for old bookmarks; program choice is no longer part of setup.
export default function LegacyProgramPage() {
  redirect('/home/')
}
