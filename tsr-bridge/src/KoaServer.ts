import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'
import { TSRTimeline, TSRTimelineObj } from 'timeline-state-resolver'

export type ServerHandles = {
	playTimeline: (id: string, groupId: string, newTimeline: TSRTimeline) => number
	stopTimeline: (id: string) => void
}

export class KoaServer {
	app: Koa
	router: Router

	constructor(serverHandles: ServerHandles) {
		this.app = new Koa()
		this.router = new Router()

		this.app.use(bodyParser())
		this.app.use(this.router.routes()).use(this.router.allowedMethods())

		this.router.post('/play-timeline', (ctx, next) => {
			console.log('POST /play-timeline')
			const id = ctx.request.body.id
			const groupId = ctx.request.body.groupId
			const newTimeline = ctx.request.body.newTimeline

			ctx.response.status = 200
			ctx.response.body = serverHandles.playTimeline(id, groupId, newTimeline)
		})

		this.router.post('/stop-timeline', (ctx, next) => {
			console.log('POST /stop-timeline')
			const id = ctx.request.body.id
			serverHandles.stopTimeline(id)
			ctx.response.status = 200
		})

		this.app.listen(5000)
		console.log('Koa is up and running.')
	}
}
