import type React from 'react'
import { cn } from '../../../../utils/tw'

type RatingGaugeProps = React.ComponentProps<'svg'> & {
  value: number
  className?: string
}

function formatPlaycount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`
  }
  return String(value)
}

// match values with lucide icons for compatibility
const size = 24
const strokeWidth = 2

// playcount gauge: normalize against a max benchmark (e.g. 60M plays)
const maxPlaycount = 60_000_000

export const SongRatingGauge = ({
  value,
  className,
  ...restSvgProps
}: RatingGaugeProps) => {
  const normalizedValue = Math.min((value / maxPlaycount) * 100, 100)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (normalizedValue / 100) * circumference
  const halfSize = size / 2

  const circleProps = {
    cx: halfSize,
    cy: halfSize,
    r: radius,
    fill: 'none',
    strokeWidth,
  }

  return (
    <div
      className={cn(
        'relative size-10 shrink-0 text-sm leading-none md:size-14 md:text-lg',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className='size-full'
        aria-valuenow={normalizedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        {...restSvgProps}
      >
        <circle {...circleProps} className='stroke-current/25' />
        <circle
          {...circleProps}
          stroke='currentColor'
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap='round'
          transform={`rotate(-90 ${halfSize} ${halfSize})`}
          className='stroke-current'
        />
      </svg>
      <div className='-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 leading-none text-center'>
        <span className='text-[0.55rem] md:text-[0.7rem]'>{formatPlaycount(value)}</span>
      </div>
    </div>
  )
}
