import { AppStore } from './AppStore'
import { GuiStore } from './GuiStore'
import { ResourcesStore } from './ResourcesStore'
import { RundownsStore } from './RundownsStore'
import { GroupPlayDataStore } from './GroupPlayDataStore'
import { ProjectStore } from './ProjectStore'

export const store = {
	guiStore: new GuiStore(),
	appStore: new AppStore(),
	projectStore: new ProjectStore(),
	rundownsStore: new RundownsStore(),
	resourcesStore: new ResourcesStore(),
	groupPlayDataStore: new GroupPlayDataStore(),
}
