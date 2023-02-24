import { AppStore } from './AppStore'
import { GuiStore } from './GuiStore'
import { ResourcesStore } from './ResourcesStore'
import { RundownsStore } from './RundownsStore'
import { GroupPlayDataStore } from './GroupPlayDataStore'
import { ProjectStore } from './ProjectStore'
import { TriggersStore } from './TriggersStore'
import { AnalogStore } from './AnalogStore'
import { GDDValidatorStore } from './GDDValidatorStoreStore'

export const store = {
	guiStore: new GuiStore(),
	appStore: new AppStore(),
	projectStore: new ProjectStore(),
	rundownsStore: new RundownsStore(),
	resourcesStore: new ResourcesStore(),
	groupPlayDataStore: new GroupPlayDataStore(),
	triggersStore: new TriggersStore(),
	analogStore: new AnalogStore(),

	gddValidatorStore: new GDDValidatorStore(),
}
