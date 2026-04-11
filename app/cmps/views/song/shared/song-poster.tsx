import { type PointerEventHandler, useState } from 'react'
import config from '../../../../config'
import { cn } from '../../../../utils/tw'
import type { Song } from '../../../../vf'

export const SongPoster = ({
  song,
  onPointerOver,
  className = '',
}: {
  song: {
    title: Song['title']
    imageUrl?: Song['imageUrl']
  }
  onPointerOver?: PointerEventHandler<HTMLImageElement>
  className?: string
}) => {
  const [hidden, setHidden] = useState(true)
  return (
    <img
      src={`${song.imageUrl}`}
      crossOrigin='anonymous'
      alt={song.title}
      className={cn('', className, {
        '!w-0 !h-0 !aspect-none !basis-0': hidden,
      })}
      onLoad={() => {
        setHidden(false)
      }}
      onError={() => {
        setHidden(true)
      }}
      onPointerOver={onPointerOver}
    />
  )
}
