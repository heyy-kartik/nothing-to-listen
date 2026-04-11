import type { Song } from '@/vf/utils'

export const SongBackdrop = ({ song }: { song: Song }) => {
  return (
    <img
      src={`${song.imageUrl}`}
      alt=''
      className='h-auto w-full'
    />
  )
}
// background - position
// : calc((((100vw / 2.222222) - 20px) / 1.5) / 2) 0
// background - image
// : url('https://media.themoviedb.org/t/p/w1000_and_h450_multi_faces/uxQW0C3TkbasUJbShlFTnvaaZP4.jpg')
// background-size: cover;
// background-repeat: no-repeat;
