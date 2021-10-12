import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";

export class Server {
  app: Koa;
  router: Router;

  constructor() {
    this.app = new Koa();
    this.router = new Router();

    this.app.use(bodyParser());
    this.app.use(this.router.routes()).use(this.router.allowedMethods());

    this.router.post("/timeline", (ctx, next) => {
      console.log("Received timeline");
      console.log(ctx.request.body);
      ctx.body = "Koa is alive!";
    });

    this.app.listen(3000);
    console.log("Koa is up and running.");
  }
}
