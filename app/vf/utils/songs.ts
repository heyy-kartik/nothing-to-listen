import type { VoroforceCell } from '../types'

export type SongData = Record<string, string | number>
export type SongBatch = SongData[]
export type SongBatches = Map<number, SongBatch>

export class Song {
  id: number
  title: string
  artist: string
  album: string
  genre: string
  listeners: number
  playcount: number
  mbid: string
  url: string
  imageUrl: string

  constructor(data: SongData) {
    this.id = Number(data.id || data.rank)
    this.title = String(data.name || data.title || '')
    this.artist = String((data.artist as any)?.name || data.artist || '')
    this.album = String(data.album || '')
    this.genre = String(data.genre || '')
    this.listeners = data.listeners ? Number(data.listeners) : 0
    this.playcount = data.playcount ? Number(data.playcount) : 0
    this.mbid = String(data.mbid || '')
    this.url = String(data.url || '')
    this.imageUrl = String(data.imageUrl || '')
  }
}

const loadCellSongBatch = async (batchIndex: number) => {
  const url = `${import.meta.env.VITE_SONG_INFO_BASE_URL || import.meta.env.VITE_FILM_INFO_BASE_URL}/${batchIndex === 0 ? 'songs' : batchIndex}.json`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.log('batchIndex', batchIndex)
    console.error('Error loading JSON:', error)
  }
}

export const getCellSong = async (
  cell: VoroforceCell,
  songBatches: SongBatches,
) => {
  if (!cell) return
  let songBatch = songBatches.get(cell.subgrid)
  if (!songBatch) {
    songBatch = await loadCellSongBatch(cell.subgrid)
    songBatches.set(cell.subgrid, songBatch ?? [])
  }

  return songBatch?.[cell.subgridIndex]
    ? new Song(songBatch[cell.subgridIndex])
    : undefined
}
