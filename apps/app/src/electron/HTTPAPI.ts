import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { IPCServer, isUndoable } from './IPCServer'
import { stringifyError } from '@shared/lib'
import { LoggerLike } from '@shared/api'

export class HTTPAPI {
	private app = new Koa()
	private router = new Router()

	private methodSignatures: {
		[fullEndpoint: string]: {
			endpoint: string
			type: string
		}
	} = {}

	constructor(port: number, ipcServer: IPCServer, log: LoggerLike) {
		this.app.use(bodyParser())
		this.router.get(`/`, async (ctx) => {
			ctx.response.body = `<html><body>
			<a href="/api/internal">Internal API (unstable)</a>
			</body></html>`
			ctx.response.status = 200
		})
		this.router.get(`/api/internal`, async (ctx) => {
			const methods = Object.entries<{ endpoint: string; type: string }>(this.methodSignatures)
				.map(([_fullEndpoint, e]) => {
					const url = `/api/internal/${e.endpoint}`
					return `<a href="${url}">${e.type} ${url}</a>`
				})
				.join('<br>\n')

			ctx.response.body = `<html><body>
			<p>Send request parameters as a JSON body.</p>
			${methods}
			</body></html>`
			ctx.response.status = 200
		})

		for (const methodName of Object.getOwnPropertyNames(IPCServer.prototype)) {
			// Ignore "private" methods.
			if (methodName[0] === '_') continue
			if (methodName === 'constructor') continue

			const originalMethod = (ipcServer as any)[methodName]
			// Ignore methods that don't exist.
			if (!originalMethod) continue

			const fcn = originalMethod.bind(ipcServer)

			let endpoint: string
			let endpointType: 'GET' | 'POST' | 'DELETE'

			if (methodName.startsWith('delete')) {
				// Handle DELETE requests

				endpoint = methodName.charAt(6).toLocaleLowerCase() + methodName.substring(7)
				endpointType = 'DELETE'
				this.router.delete(`/api/internal/${endpoint}`, async (ctx) => {
					try {
						const result = await fcn(ctx.request.body)
						if (isUndoable(result)) {
							ctx.response.body = result.result
						} else {
							ctx.response.body = result
						}
						ctx.response.status = 200
					} catch (error) {
						const stringifiedError = stringifyError(error)
						if (stringifiedError.match(/not found/i)) {
							ctx.response.status = 404
						} else {
							ctx.response.status = 500
						}
					}
				})
			} else {
				// Handle POST requests

				endpoint = methodName
				endpointType = 'POST'
				this.router.post(`/api/internal/${endpoint}`, async (ctx) => {
					try {
						const result = await fcn(ctx.request.body)
						if (isUndoable(result)) {
							ctx.response.body = result.result
						} else {
							ctx.response.body = result
						}
						ctx.response.status = 200
					} catch (error) {
						const stringifiedError = stringifyError(error)
						if (stringifiedError.match(/not found/i)) {
							ctx.response.status = 404
						} else {
							ctx.response.status = 500
						}
					}
				})
			}

			const fullEndpoint = `${endpointType} ${endpoint}`
			if (this.methodSignatures[fullEndpoint]) {
				throw new Error(`Duplicate API endpoints "${fullEndpoint}"!`)
			}
			this.methodSignatures[fullEndpoint] = {
				type: endpointType,
				endpoint,
			}
		}

		this.app.use(this.router.routes()).use(this.router.allowedMethods())
		this.app.listen(port)
		log.info(`Internal HTTP API available at http://localhost:${port}/api/internal`)
	}
}
