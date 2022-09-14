import Koa from 'koa'
import Router from '@koa/router'
import { IPCServer, isUndoable } from './IPCServer'
import { stringifyError } from '@shared/lib'

export const HTTP_API_PORT = 5500

export class HTTPAPI {
	private app = new Koa()
	private router = new Router()

	constructor(port: number, ipcServer: IPCServer) {
		for (const methodName of Object.getOwnPropertyNames(IPCServer.prototype)) {
			// Ignore "private" methods.
			if (methodName[0] === '_') {
				continue
			}

			const fcn = (ipcServer as any)[methodName].bind(ipcServer)

			// Ignore methods that don't exist.
			if (!fcn) {
				continue
			}

			if (methodName.startsWith('get')) {
				// Handle GET requests
				this.router.get(
					`/api/${methodName.charAt(3).toLocaleLowerCase() + methodName.substring(4)}`,
					async (ctx) => {
						try {
							const result = await fcn(ctx.request.query)
							ctx.response.body = result
							ctx.response.status = 200
						} catch (error) {
							const stringifiedError = stringifyError(error)
							if (stringifiedError.includes('not found')) {
								ctx.response.status = 404
							} else {
								ctx.response.status = 500
							}
						}
					}
				)
			} else if (methodName.startsWith('delete')) {
				// Handle DELETE requests
				this.router.delete(
					`/api/${methodName.charAt(6).toLocaleLowerCase() + methodName.substring(7)}`,
					async (ctx) => {
						try {
							const result = await fcn(ctx.request.query)
							if (isUndoable(result)) {
								ctx.response.body = result.result
							} else {
								ctx.response.body = result
							}
							ctx.response.status = 200
						} catch (error) {
							const stringifiedError = stringifyError(error)
							if (stringifiedError.includes('not found')) {
								ctx.response.status = 404
							} else {
								ctx.response.status = 500
							}
						}
					}
				)
			} else {
				// Handle POST requests
				this.router.post(`/api/${methodName}`, async (ctx) => {
					try {
						const result = await fcn(ctx.request.query)
						if (isUndoable(result)) {
							ctx.response.body = result.result
						} else {
							ctx.response.body = result
						}
						ctx.response.status = 200
					} catch (error) {
						const stringifiedError = stringifyError(error)
						if (stringifiedError.includes('not found')) {
							ctx.response.status = 404
						} else {
							ctx.response.status = 500
						}
					}
				})
			}
		}

		this.app.use(this.router.routes()).use(this.router.allowedMethods())
		this.app.listen(port)
	}
}
