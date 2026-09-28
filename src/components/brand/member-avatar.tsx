'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Side } from '@/lib/side'

// Branded member avatar (Brandbook p.45–46): initials on a solid side-coloured
// circle, with the member's photo on top when there is one and it loads.
// Google profile photos expire or 403 often enough that the fallback is the
// common case, so it has to look intentional rather than broken.

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Initials are Figtree Bold at every size. Boldonse is kept to one moment per
// screen (review feedback on pass 1), and a directory page shows dozens of these.
const SIZE: Record<AvatarSize, { box: string; px: number; text: string }> = {
  xs: { box: 'size-6', px: 24, text: 'text-[0.625rem] font-bold' },
  sm: { box: 'size-8', px: 32, text: 'text-xs font-bold' },
  md: { box: 'size-12', px: 48, text: 'text-base font-bold' },
  lg: { box: 'size-16', px: 64, text: 'text-xl font-bold' },
  xl: { box: 'size-24', px: 96, text: 'text-3xl font-bold' },
}

// Fixed per side, so a Sisters member's avatar stays green when a Brothers
// member views it. With no side, it follows the viewer's theme.
const SIDE_FILL: Record<Side | 'general', string> = {
  brothers: 'bg-brand-royal text-white',
  sisters: 'bg-brand-jade text-white',
  general: 'bg-brand-obsidian text-brand-snow',
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0].charAt(0)
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
}

interface MemberAvatarProps {
  name: string
  src?: string | null
  /** The member's side. Omit to follow the active theme (e.g. your own avatar). */
  side?: Side | 'general' | null
  size?: AvatarSize
  className?: string
  /**
   * Hide from screen readers. Use when the name is printed right beside the
   * avatar (cards, table rows), so it isn't announced twice.
   */
  decorative?: boolean
}

export function MemberAvatar({ name, src, side, size = 'md', className, decorative }: MemberAvatarProps) {
  const [failed, setFailed] = useState(false)
  const s = SIZE[size]
  const fill = side ? SIDE_FILL[side] : 'bg-primary text-primary-foreground'
  const showImage = Boolean(src) && !failed

  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
        s.box,
        fill,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('leading-none', s.text)}>
        {getInitials(name)}
      </span>
      {showImage && (
        <Image
          src={src!}
          alt=""
          width={s.px}
          height={s.px}
          className="absolute inset-0 size-full object-cover"
          referrerPolicy="no-referrer"
          unoptimized
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}
