import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'
import { Mappings, TSRTimeline } from 'timeline-state-resolver'

export type ServerHandles = {
	playTimeline: (id: string, timeline: TSRTimeline) => void
	updateMappings: (mappings: Mappings) => void
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
			const timeline = ctx.request.body.timeline

			ctx.response.status = 200
			ctx.response.body = serverHandles.playTimeline(id, timeline)
		})
		this.router.post('/update-mappings', (ctx, next) => {
			console.log('POST /update-mappings')
			const mappings = ctx.request.body.mappings

			ctx.response.status = 200
			ctx.response.body = serverHandles.updateMappings(mappings)
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
