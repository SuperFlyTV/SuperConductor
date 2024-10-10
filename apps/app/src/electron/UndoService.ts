import { LoggerLike } from '@shared/api'
import { ActionDescription, UndoableResult } from '../ipc/IPCAPI'
import EventEmitter from 'events'
import _ from 'lodash'
import { SerializableLedgers } from '../models/project/Project'
import { SpecialLedgers } from '../models/project/Project'

export const MAX_UNDO_LEDGER_LENGTH = 100

export interface UndoLedger {
	actions: Action[]
	pointer: UndoPointer
}
export type UndoLedgerKey = string | SpecialLedgers
type UndoPointer = number
type UndoFunction = () => Promise<void> | void
export type UndoableFunction = (...args: any[]) => Promise<UndoableResult<any>>
interface Action {
	description: ActionDescription
	arguments: unknown[]
	redo: UndoableFunction
	undo: UndoFunction
}

type UndoServiceEvents = {
	updatedUndoLedger: [undoLedgers: SerializableLedgers]
}

export class UndoLedgerService extends EventEmitter<UndoServiceEvents> {
	constructor(private _log: LoggerLike) {
		super()
	}
	private undoLedgers = new Map<UndoLedgerKey, UndoLedger>()

	public pushUndoable(key: UndoLedgerKey, args: unknown[], fcn: () => any, result: UndoableResult): void {
		let ledger = this.undoLedgers.get(key)
		if (!ledger) {
			ledger = this.makeEmptyLedger()
			this.undoLedgers.set(key, ledger)
		}
		ledger.actions.splice(ledger.pointer + 1, ledger.actions.length)
		// Add the new action to the undo ledger:
		ledger.actions.push({
			description: result.description,
			arguments: args,
			undo: result.undo,
			redo: fcn,
		})
		if (ledger.actions.length > MAX_UNDO_LEDGER_LENGTH) {
			ledger.actions.splice(0, ledger.actions.length - MAX_UNDO_LEDGER_LENGTH)
		}
		ledger.pointer = ledger.actions.length - 1
		this.emitUpdate()
	}

	private emitUpdate() {
		this.emit('updatedUndoLedger', this.toSerializable())
	}

	public async undo(key: UndoLedgerKey): Promise<void> {
		const ledger = this.undoLedgers.get(key)
		const action = ledger?.actions?.[ledger?.pointer]
		if (!action) return
		try {
			await action.undo()
			ledger.pointer--
		} catch (error) {
			this._log.error('Error when undoing:', error)

			// Clear
			this.undoLedgers.set(key, this.makeEmptyLedger())
		}
		this.emitUpdate()
	}

	public async redo(key: UndoLedgerKey): Promise<void> {
		const ledger = this.undoLedgers.get(key)
		const action = ledger?.actions?.[ledger?.pointer + 1]
		if (!action) return
		try {
			const redoResult = await action.redo(...action.arguments)
			action.undo = redoResult.undo
			ledger.pointer++
		} catch (error) {
			this._log.error('Error when redoing:', error)

			// Clear
			this.undoLedgers.set(key, this.makeEmptyLedger())
		}
		this.emitUpdate()
	}

	private makeEmptyLedger(): UndoLedger {
		return {
			actions: [],
			pointer: -1,
		}
	}

	private toSerializable(): SerializableLedgers {
		return _.mapValues(Object.fromEntries<UndoLedger>(this.undoLedgers.entries()), (ledger: UndoLedger) => ({
			undo: ledger.actions[ledger.pointer]
				? { description: ledger.actions[ledger.pointer]?.description }
				: undefined,
			redo: ledger.actions[ledger.pointer + 1]
				? { description: ledger.actions[ledger.pointer + 1]?.description }
				: undefined,
		}))
	}
}
