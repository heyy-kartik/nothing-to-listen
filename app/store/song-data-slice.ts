import type { StateCreator } from 'zustand'
import type { Song, SongBatch, SongData } from '../vf'

export interface SongDataSlice {
  song?: Song
  setSong: (song?: Song) => void
  songBatches: Map<number, SongData[]>
}

export const createSongDataSlice: StateCreator<
  SongDataSlice,
  [],
  [],
  SongDataSlice
> = (set) => ({
  setSong: (song?: Song) => set({ song }),
  songBatches: new Map<number, SongBatch>(),
})
