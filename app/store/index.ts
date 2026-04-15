import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import { type SongDataSlice, createSongDataSlice } from './song-data-slice'
import { type UiSlice, createUiSlice } from './ui-slice'
import { type VoroforceSlice, createEngineSlice } from './voroforce-slice'

export type StoreState = UiSlice & VoroforceSlice & SongDataSlice

export const store = create(
  subscribeWithSelector<StoreState>((...a) => ({
    ...createUiSlice(...a),
    ...createEngineSlice(...a),
    ...createSongDataSlice(...a),
  })),
)

export const useShallowState = <U>(selector: (state: StoreState) => U) =>
  store(useShallow(selector))

// Re-export slice types for convenience
export type { SongDataSlice, VoroforceSlice, UiSlice }

// Export selectors
export * from './selectors'
