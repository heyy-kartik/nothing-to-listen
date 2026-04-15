import { HeartOff, HeartPlus, Plus } from 'lucide-react'
import type { DialogProps } from 'vaul'
import { useShallowState } from '../../../../../store'
import { cn } from '../../../../../utils/tw'
import type { Song, VoroforceCell } from '../../../../../vf'
import { CustomLinks } from '../../../../common/custom-links'
import { StdLinks } from '../../../../common/standard-links'
import { Button } from '../../../../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../ui/tooltip'

export const SongViewFooter = ({
  song,
  voroforceCell,
  className = '',
  handleClose,
  direction,
}: {
  song?: Song
  voroforceCell?: VoroforceCell
  className?: string
  handleClose?: () => void
  direction: DialogProps['direction']
}) => {
  const { userConfig, setUserConfig, isFavorite, setAddCustomLinkTypeOpen } =
    useShallowState((state) => ({
      userConfig: state.userConfig,
      setUserConfig: state.setUserConfig,
      isFavorite: song && state.userConfig?.favorites?.[song.id],
      setAddCustomLinkTypeOpen: state.setAddCustomLinkTypeOpen,
    }))

  if (!song) return
  return (
    <div
      className={cn(
        'relative flex w-full flex-row justify-between gap-3 px-4 py-4 md:gap-6 md:p-6 lg:p-6 xl:p-9',
        className,
        {},
      )}
    >
      <div className={cn('pointer-events-auto flex flex-row gap-3')}>
        <StdLinks song={song} />
        <CustomLinks song={song} />
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                className={cn(
                  'hidden cursor-pointer rounded-lg border-foreground md:inline-flex md:backdrop-blur-lg',
                )}
                variant='outline'
                // onClick={toggleAddCustomLinkTypeOpen}
                onClick={() => setAddCustomLinkTypeOpen(direction)}
              >
                <Plus />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new link type</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className='pointer-events-auto flex flex-row gap-3'>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant={isFavorite ? 'default' : 'outline'}
                onClick={() => {
                  if (isFavorite) {
                    delete userConfig.favorites?.[song.id]
                  } else {
                    if (!userConfig.favorites) userConfig.favorites = {}
                    userConfig.favorites[song.id] = {
                      cellId: voroforceCell?.id,
                      id: song.id,
                      title: song.title,
                      artist: song.artist,
                      album: song.album,
                      genre: song.genre,
                      imageUrl: song.imageUrl,
                      url: song.url,
                    }
                  }
                  setUserConfig(userConfig)
                }}
                className='pointer-events-auto hidden rounded-lg border-foreground backdrop-blur-lg md:inline-flex'
              >
                {isFavorite ? <HeartOff /> : <HeartPlus />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant='outline'
          onClick={handleClose}
          className='pointer-events-auto rounded-lg border-foreground backdrop-blur-lg md:w-36'
        >
          Close
        </Button>
      </div>
    </div>
  )
}
