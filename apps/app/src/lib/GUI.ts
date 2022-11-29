export type CurrentSelectionAny = CurrentSelectionGroup | CurrentSelectionPart | CurrentSelectionTimelineObj
export interface CurrentSelectionBase {
	type: 'group' | 'part' | 'timelineObj'
}
export interface CurrentSelectionGroup extends CurrentSelectionBase {
	type: 'group'
	groupId: string
}
export interface CurrentSelectionPart extends CurrentSelectionBase {
	type: 'part'
	groupId: string
	partId: string
}
export interface CurrentSelectionTimelineObj extends CurrentSelectionBase {
	type: 'timelineObj'
	groupId: string
	partId: string
	timelineObjId: string
}
