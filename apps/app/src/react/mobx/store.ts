import { AppStore } from './AppStore'
import { GuiStore } from './GuiStore'
import { ResourcesStore } from './ResourcesStore'
import { RundownsStore } from './RundownsStore'

export const store = {
	guiStore: new GuiStore(),
	appStore: new AppStore(),
	rundownsStore: new RundownsStore(),
	resourcesStore: new ResourcesStore(),
}
