import { FormControl } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Expression, ExpressionObj } from 'superfly-timeline'
import { MentionsInput, Mention, OnChangeHandlerFunc, DataFunc, SuggestionDataItem } from 'react-mentions'
import { interpretExpression } from 'superfly-timeline/dist/resolver/expression'
import { store } from '../../../mobx/store'
import { describeTimelineObject } from '../../../../lib/TimelineObj'
import { scatterMatchString } from '../../../../lib/util'

import './style.scss'
import _ from 'lodash'

const MAX_SEARCH_COUNT = 10

export const ExpressionInput: React.FC<{
	expression: Expression | undefined
	onChange: (newValue: string) => void
	label?: React.ReactNode

	fullWidth?: boolean
}> = (props) => {
	// const expression = interpretExpression(props.expression) as ExpressionObj

	const [value, setValue] = useState('')

	useEffect(() => {
		const exprStr = props.expression ? stringifyExpression(props.expression) : ''
		setValue(exprStr)
	}, [props.expression])

	const handleChange = useCallback<OnChangeHandlerFunc>((target, newValue, newPlain, mentions) => {
		// Example: @[aaaa: ASSETS1080/NO_CLIP_LOOP](#ipG1WWFY) @[.rrr](.rrr)

		// console.log('handleChange', target, newValue, newPlain, mentions)
		setValue(newValue)
	}, [])
	const handleSave = useCallback(() => {
		// Example: @[aaaa: ASSETS1080/NO_CLIP_LOOP](#ipG1WWFY) @[.rrr](.rrr)

		// Convert the mentions-string to an expression-like string:
		const expr = value.replace(/@\[([^\]]+)\]\(([^\)]+)\)/g, '$2')

		console.log('handleSave', value, expr)
		props.onChange(expr)
	}, [value])
	const queryObject = useCallback<DataFunc>((query: string, cb) => {
		const list: SuggestionDataItem[] = []
		const rundownIds = store.rundownsStore.getRundownIds()
		for (const rundownId of rundownIds) {
			const groups = store.rundownsStore.getRundownGroups(rundownId)
			for (const group of groups) {
				const parts = store.rundownsStore.getGroupParts(group.id)
				for (const part of parts) {
					const timeline = store.rundownsStore.getPartTimeline(part.id)
					for (const timelineObj of timeline) {
						const label = `${part.resolved.label}: ${describeTimelineObject(timelineObj.obj).label}`

						if (
							scatterMatchString(label, query) !== null ||
							scatterMatchString(timelineObj.obj.id, query) !== null
						) {
							list.push({
								id: '#' + timelineObj.obj.id,
								display: label,
							})
						}
						if (list.length >= MAX_SEARCH_COUNT) break
					}
					if (list.length >= MAX_SEARCH_COUNT) break
				}
				if (list.length >= MAX_SEARCH_COUNT) break
			}
			if (list.length >= MAX_SEARCH_COUNT) break
		}
		cb(list)
	}, [])
	const queryClassName = useCallback<DataFunc>((query, cb) => {
		const classNames = new Set<string>()

		const rundownIds = store.rundownsStore.getRundownIds()
		for (const rundownId of rundownIds) {
			const groups = store.rundownsStore.getRundownGroups(rundownId)
			for (const group of groups) {
				if (group.classes) {
					for (const className of group.classes) {
						if (classNames.size >= MAX_SEARCH_COUNT) break

						if (scatterMatchString(className, query) !== null) {
							classNames.add(className)
						}
					}
				}

				const parts = store.rundownsStore.getGroupParts(group.id)
				for (const part of parts) {
					if (classNames.size >= MAX_SEARCH_COUNT) break

					if (part.classes) {
						for (const className of part.classes) {
							if (classNames.size >= MAX_SEARCH_COUNT) break

							if (scatterMatchString(className, query) !== null) {
								classNames.add(className)
							}
						}
					}

					const timeline = store.rundownsStore.getPartTimeline(part.id)
					for (const timelineObj of timeline) {
						if (classNames.size >= MAX_SEARCH_COUNT) break

						if (timelineObj.obj.classes) {
							for (const className of timelineObj.obj.classes) {
								if (classNames.size >= MAX_SEARCH_COUNT) break

								if (scatterMatchString(className, query) !== null) {
									classNames.add(className)
								}
							}
						}
					}
				}
				if (classNames.size >= MAX_SEARCH_COUNT) break
			}
			if (classNames.size >= MAX_SEARCH_COUNT) break
		}

		const list: SuggestionDataItem[] = []
		for (const className of classNames.values()) {
			list.push({
				id: `.${className}`,
				display: `.${className}`,
			})
		}
		cb(list)
	}, [])
	const queryLayerName = useCallback<DataFunc>((query, cb) => {
		const list: SuggestionDataItem[] = []

		const mappings = store.projectStore.project.mappings

		for (const [layerId, mapping] of Object.entries(mappings)) {
			if (
				scatterMatchString(layerId, query) !== null ||
				(mapping.layerName && scatterMatchString(mapping.layerName, query) !== null)
			) {
				list.push({
					id: '$' + layerId,
					display: mapping.layerName || layerId,
				})
			}
			if (list.length >= MAX_SEARCH_COUNT) break
		}

		cb(list)
	}, [])

	return (
		// <FormControl variant="outlined" margin="dense" size="small" fullWidth={props.fullWidth}>
		// 	<div className="expression-input">test test</div>
		// </FormControl>
		<MentionsInput
			value={value}
			onChange={handleChange}
			onBlur={handleSave}
			singleLine={true}
			className="expression-input"
			style={{
				control: {
					backgroundColor: '#3a3e54',
					fontSize: 14,
					fontWeight: 'normal',
				},
				suggestions: {
					list: {
						backgroundColor: '#3a3e54',
						border: '1px solid rgba(0,0,0,0.15)',
						fontSize: 14,
					},
					item: {
						padding: '5px 15px',
						borderBottom: '1px solid rgba(0,0,0,0.15)',
						'&focused': {
							backgroundColor: '#cee4e5',
							color: '#000',
						},
					},
				},
			}}
		>
			<Mention
				trigger="#"
				data={queryObject}
				// renderSuggestion={this.renderUserSuggestion}
			/>
			<Mention
				trigger="."
				data={queryClassName}
				// renderSuggestion={this.renderTagSuggestion}
			/>
			<Mention
				trigger="$"
				data={queryLayerName}
				// renderSuggestion={this.renderTagSuggestion}
			/>
		</MentionsInput>
	)
}

// TMP, this will be exposed by superfly-timeline instead (soon):
function stringifyExpression(expr: Expression): string {
	return stringifyExpressionInner(expr, undefined)
}
function stringifyExpressionInner(expr0: Expression, outerExpression: ExpressionObj | undefined): string {
	const expr = interpretExpression(expr0)
	if (expr === null) return ''

	if (typeof expr === 'string') return expr
	if (typeof expr === 'number') return '' + expr

	const l = isExpressionObject(expr.l)
		? `${stringifyExpressionInner(expr.l, expr)}`
		: stringifyExpressionInner(expr.l, expr)
	const r = isExpressionObject(expr.r)
		? `${stringifyExpressionInner(expr.r, expr)}`
		: stringifyExpressionInner(expr.r, expr)
	// console.log(expr)

	let str = ''
	if (expr.o === '!') {
		str += `${expr.o}${r}`
	} else {
		str += `${l} ${expr.o} ${r}`

		if (outerExpression) {
			if (operatorsCanBeCombined(expr, outerExpression)) str = `${str}`
			else str = `(${str})`
		}
	}

	return str
}
/** Returns true if the expression can be combined without the need for a paranthesis */
function operatorsCanBeCombined(outerExpr: ExpressionObj, expr: Expression): boolean {
	const o = isExpressionObject(expr) ? expr.o : ''

	if (o === outerExpr.o) return true
	if (o === '+' && outerExpr.o === '-') return true
	// if (o === '-' && outerExpr.o === '+') return true
	return false
}

function isExpressionObject(expr: Expression): expr is ExpressionObj {
	return typeof expr === 'object' && _.has(expr, 'l') && _.has(expr, 'o') && _.has(expr, 'r')
}
