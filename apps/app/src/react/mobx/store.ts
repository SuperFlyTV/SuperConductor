import { AppStore } from './AppStore'
import { GuiStore } from './GuiStore'
import { ResourcesStore } from './ResourcesStore'
import { RundownsStore } from './RundownsStore'
import { GroupPlayDataStore } from './GroupPlayDataStore'

export const store = {
	guiStore: new GuiStore(),
	appStore: new AppStore(),
	rundownsStore: new RundownsStore(),
	resourcesStore: new ResourcesStore(),
	groupPlayDataStore: new GroupPlayDataStore(),
}
