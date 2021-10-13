import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'
import { TSRTimeline } from 'timeline-state-resolver'

export type ServerHandles = {
	handleTimeline: (timeline: TSRTimeline) => void
}

export class KoaServer {
	app: Koa
	router: Router

	constructor(serverHandles: ServerHandles) {
		this.app = new Koa()
		this.router = new Router()

		this.app.use(bodyParser())
		this.app.use(this.router.routes()).use(this.router.allowedMethods())

		this.router.post('/timeline', (ctx, next) => {
			const timeline = ctx.request.body
			serverHandles.handleTimeline(timeline)
			ctx.response.status = 200
		})

		this.app.listen(5000)
		console.log('Koa is up and running.')
	}
}
