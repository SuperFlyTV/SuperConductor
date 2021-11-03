import { Column, useTable } from 'react-table'
import React from 'react'
import { BsFillTrashFill } from 'react-icons/bs'
import { InfoGroup } from './InfoGroup'
import {
	DELETE_TEMPLATE_DATA_CHANNEL,
	IDeleteTemplateDataChannel,
	INewTemplateDataChannel,
	IUpdateTemplateDataChannel,
	NEW_TEMPLATE_DATA_CHANNEL,
	UPDATE_TEMPLATE_DATA_CHANNEL,
} from '@/ipc/channels'

const { ipcRenderer } = window.require('electron')

type IUpdateData = (rowId: string, columnId: string, oldValue: string, newValue: string) => void
type IDeleteRow = (rowId: string) => void

interface IEditableCell {
	value: string
	row: { values: any }
	column: { id: string }
	onUpdateData: IUpdateData
	onDelete: IDeleteRow
}

const EditableCell = ({
	value: initialValue,
	column: { id: columnId },
	row,
	onUpdateData,
	onDelete,
}: IEditableCell) => {
	// We need to keep and update the state of the cell normally
	const [value, setValue] = React.useState(initialValue)

	const onChange = (e: any) => {
		setValue(e.target.value)
	}

	// We'll only update the external data when the input is blurred
	const onBlur = () => {
		onUpdateData(row.values.key, columnId, initialValue, value)
	}

	// If the initialValue is changed external, sync it up with our state
	React.useEffect(() => {
		setValue(initialValue)
	}, [initialValue])

	if (columnId === 'delete') {
		return (
			<button className="delete" onClick={() => onDelete(row.values.key)}>
				<BsFillTrashFill color="white" size={12} />
			</button>
		)
	}

	return <input value={value} onChange={onChange} onBlur={onBlur} />
}

// Set our editable cell renderer as the default Cell renderer
const defaultColumn = {
	Cell: EditableCell,
}

interface ITemplateData {
	timelineObjId: string
	templateData: { [id: string]: string }
}

export const TemplateData = (props: ITemplateData) => {
	const handleUpdateData: IUpdateData = (rowId, columnId, oldValue, newValue) => {
		if (oldValue === newValue) return
		const data: IUpdateTemplateDataChannel = {
			timelineObjId: props.timelineObjId,
			key: rowId,
			changedItemId: columnId,
			value: newValue,
		}
		ipcRenderer.send(UPDATE_TEMPLATE_DATA_CHANNEL, data)
	}

	const handleAddNew = () => {
		const data: INewTemplateDataChannel = {
			timelineObjId: props.timelineObjId,
		}
		ipcRenderer.send(NEW_TEMPLATE_DATA_CHANNEL, data)
	}

	const handleDelete: IDeleteRow = (rowId: string) => {
		const data: IDeleteTemplateDataChannel = {
			timelineObjId: props.timelineObjId,
			key: rowId,
		}
		ipcRenderer.send(DELETE_TEMPLATE_DATA_CHANNEL, data)
	}

	const data: Array<any> = []
	Object.keys(props.templateData).forEach((key) => {
		data.push({
			key: key,
			value: props.templateData[key],
		})
	})

	const columns: Array<Column> = React.useMemo(
		() => [
			{
				Header: 'Key',
				accessor: 'key',
			},
			{
				Header: 'Value',
				accessor: 'value',
			},
			{
				Header: '',
				accessor: 'delete',
			},
		],
		[]
	)

	const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
		columns,
		data,
		defaultColumn,
	})

	return (
		<InfoGroup title="Template data">
			<div className="template-data">
				<table {...getTableProps()} className="editable template-data">
					<thead>
						{headerGroups.map((headerGroup) => (
							<tr {...headerGroup.getHeaderGroupProps()}>
								{headerGroup.headers.map((column) => (
									<th {...column.getHeaderProps()}>{column.render('Header')}</th>
								))}
							</tr>
						))}
					</thead>
					<tbody {...getTableBodyProps()}>
						{rows.map((row) => {
							prepareRow(row)
							return (
								<tr {...row.getRowProps()}>
									{row.cells.map((cell) => {
										return (
											<td {...cell.getCellProps()}>
												{cell.render('Cell', { onUpdateData: handleUpdateData, onDelete: handleDelete })}
											</td>
										)
									})}
								</tr>
							)
						})}
					</tbody>
				</table>

				<div className="btn-row-right">
					<button className="btn form" onClick={handleAddNew}>
						Add
					</button>
				</div>
			</div>
		</InfoGroup>
	)
}
