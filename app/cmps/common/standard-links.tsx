import { cn } from '../../utils/tw'
import type { Song } from '../../vf'
import { Button } from '../ui/button'

export const StdLinks = ({
  song,
  buttonClassName = '',
}: {
  song: {
    title: Song['title']
    artist?: Song['artist']
    id: Song['id']
  }
  buttonClassName?: string
}) => {
  return (
    <>
      <Button
        asChild
        variant='outline'
        className={cn(
          'rounded-lg border-foreground md:backdrop-blur-lg',
          buttonClassName,
        )}
      >
        <a
          href={`https://last.fm/music/${encodeURIComponent(song.artist || '')}/_/${encodeURIComponent(song.title)}`}
          target='_blank'
          rel='noreferrer'
        >
          Last.fm
        </a>
      </Button>
    </>
  )
}
