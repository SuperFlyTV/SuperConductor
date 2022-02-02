import { Column, useTable } from 'react-table'
import React, { useContext } from 'react'
import { BsFillTrashFill } from 'react-icons/bs'
import { InfoGroup } from './InfoGroup'
import { IPCServerContext } from '../../contexts/IPCServer'
import { Button } from '@mui/material'

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

export const TemplateData: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	timelineObjId: string
	templateData: { [id: string]: string }
}> = (props) => {
	const ipcServer = useContext(IPCServerContext)
	const handleUpdateData: IUpdateData = (rowId, columnId, oldValue, newValue) => {
		if (oldValue === newValue) return

		ipcServer
			.updateTemplateData({
				rundownId: props.rundownId,
				groupId: props.groupId,
				partId: props.partId,
				timelineObjId: props.timelineObjId,
				key: rowId,
				changedItemId: columnId,
				value: newValue,
			})
			.catch(console.error)
	}

	const handleAddNew = () => {
		ipcServer
			.newTemplateData({
				rundownId: props.rundownId,
				groupId: props.groupId,
				partId: props.partId,
				timelineObjId: props.timelineObjId,
			})
			.catch(console.error)
	}

	const handleDelete: IDeleteRow = (rowId: string) => {
		ipcServer
			.deleteTemplateData({
				rundownId: props.rundownId,
				groupId: props.groupId,
				partId: props.partId,
				timelineObjId: props.timelineObjId,
				key: rowId,
			})
			.catch(console.error)
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
							// eslint-disable-next-line react/jsx-key
							<tr {...headerGroup.getHeaderGroupProps()}>
								{headerGroup.headers.map((column) => (
									// eslint-disable-next-line react/jsx-key
									<th {...column.getHeaderProps()}>{column.render('Header')}</th>
								))}
							</tr>
						))}
					</thead>
					<tbody {...getTableBodyProps()}>
						{rows.map((row) => {
							prepareRow(row)
							return (
								// eslint-disable-next-line react/jsx-key
								<tr {...row.getRowProps()}>
									{row.cells.map((cell) => {
										return (
											// eslint-disable-next-line react/jsx-key
											<td {...cell.getCellProps()}>
												{cell.render('Cell', {
													onUpdateData: handleUpdateData,
													onDelete: handleDelete,
												})}
											</td>
										)
									})}
								</tr>
							)
						})}
					</tbody>
				</table>

				<div className="btn-row-right">
					<Button className="btn" variant="contained" onClick={handleAddNew}>
						Add
					</Button>
				</div>
			</div>
		</InfoGroup>
	)
}
