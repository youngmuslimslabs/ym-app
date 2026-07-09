'use client'

import { useEffect, useRef } from 'react'

interface JotformEmbedProps {
  formId: string
  title?: string
  minHeight?: number
}

export function JotformEmbed({
  formId,
  title = 'Jotform',
  minHeight = 1000
}: JotformEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasReceivedResizeRef = useRef(false)

  useEffect(() => {
    // Load the Jotform embed-handler script once (it's a shared global helper);
    // if a previous mount already added it, don't add a duplicate.
    if (!document.querySelector('script[src*="for-form-embed-handler"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js'
      script.async = true
      document.body.appendChild(script)
    }

    // Always register the resize listener on mount — even when the script was
    // already loaded by an earlier mount. (Previously this returned early when
    // the script existed, so auto-resize silently broke on remount and the
    // iframe stayed stuck at its initial height.)
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'string') return

      const args = e.data.split(':')
      if (args[0] === 'setHeight' && iframeRef.current) {
        const height = parseInt(args[1])
        if (!isNaN(height) && height > 0) {
          hasReceivedResizeRef.current = true
          iframeRef.current.style.height = height + 'px'
          // Also update container to match
          if (containerRef.current) {
            containerRef.current.style.height = height + 'px'
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Fallback: Enable scrolling if auto-resize doesn't work within 3 seconds
    const fallbackTimer = setTimeout(() => {
      if (iframeRef.current && !hasReceivedResizeRef.current) {
        iframeRef.current.removeAttribute('scrolling')
        iframeRef.current.style.overflow = 'auto'
      }
    }, 3000)

    // Cleanup: remove this mount's listener/timer. The shared embed-handler
    // script is intentionally left in the DOM for reuse across mounts.
    return () => {
      clearTimeout(fallbackTimer)
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ minHeight: '500px', position: 'relative' }}>
      <iframe
        ref={iframeRef}
        id={`JotFormIFrame-${formId}`}
        title={title}
        src={`https://form.jotform.com/${formId}`}
        style={{
          width: '100%',
          height: `${minHeight}px`,
          maxWidth: '100%',
          border: 'none',
        }}
        scrolling="no"
        allow="geolocation; microphone; camera; fullscreen"
      />
    </div>
  )
}
