import { AppStore } from './AppStore'
import { GuiStore } from './GuiStore'

export const store = {
	guiStore: new GuiStore(),
	appStore: new AppStore(),
}
