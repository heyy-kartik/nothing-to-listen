import { About } from './about'
import { Favorites } from './favorites'
import { SongPreview, SongViewDrawer } from './song'
import { HotkeysView } from './hotkeys'
import { LowFpsAlert } from './low-fps-alert'
import { Settings } from './settings'

const PrimaryViews = () => (
  <>
    <Settings />
    <About />
    <Favorites />
    <SongPreview />
    <SongViewDrawer />
    <LowFpsAlert />
    <HotkeysView />
  </>
)

export default PrimaryViews
