import { AppStore } from './AppStore.js'
import { GuiStore } from './GuiStore.js'
import { ResourcesAndMetadataStore } from './ResourcesAndMetadataStore.js'
import { RundownsStore } from './RundownsStore.js'
import { GroupPlayDataStore } from './GroupPlayDataStore.js'
import { ProjectStore } from './ProjectStore.js'
import { TriggersStore } from './TriggersStore.js'
import { AnalogStore } from './AnalogStore.js'
import { GDDValidatorStore } from './GDDValidatorStoreStore.js'

export const store = {
	guiStore: new GuiStore(),
	appStore: new AppStore(),
	projectStore: new ProjectStore(),
	rundownsStore: new RundownsStore(),
	resourcesAndMetadataStore: new ResourcesAndMetadataStore(),
	groupPlayDataStore: new GroupPlayDataStore(),
	triggersStore: new TriggersStore(),
	analogStore: new AnalogStore(),

	gddValidatorStore: new GDDValidatorStore(),
}
