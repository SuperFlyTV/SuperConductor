import { AppStore } from './AppStore'
import { GuiStore } from './GuiStore'
import { ResourcesAndMetadataStore } from './ResourcesAndMetadataStore'
import { RundownsStore } from './RundownsStore'
import { GroupPlayDataStore } from './GroupPlayDataStore'
import { ProjectStore } from './ProjectStore'
import { TriggersStore } from './TriggersStore'
import { AnalogStore } from './AnalogStore'
import { GDDValidatorStore } from './GDDValidatorStoreStore'
import { ExtensionsStore } from './ExtensionsStore'

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

	extensions: new ExtensionsStore(),
}
