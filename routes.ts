import { User } from "./models";

import { Express } from "express";
import { is } from "typia";

const BASEROUTE = "/api/v1/";

const route = (endpoint: Endpoint) => BASEROUTE + endpoint;

export const defineRoutes = (app: Express) => {
  const routeBuilder = (
    type: method,
    endpoint: Endpoint,
    callback: (req: any, currentUser?: string) => Promise<{ resp: Resp; code: number }>,
    authRequired?: boolean
  ) => {
    let currentUser: string | undefined;
    app[type](route(endpoint), async (req, res) => {
      if (authRequired) {
        let resp: Resp = { error: "Unauthorized" };
        if (!req.headers.authorization) { 
          res.status(401).type("application/json").send(resp);
          return;
        }

        resp.error = "BadRequest";
        try {
          const auth = JSON.parse(req.headers.authorization as string);
          if (!is<Authorization>(auth)) {
            res.status(400).type("application/json").send(resp);
            return;
          }

          const user = await User.findOne({ email: auth.username, tokens: auth.password });

          if (user == null) {
            resp.error = "Unauthorized";
            res.status(401).type("application/json").send(resp);
            return;
          }

          currentUser = user.email;
        } catch {
          res.status(400).type("application/json").send(resp);
          return;
        }
      }
      try {
        let requ: any = {};
        const data = req.read();
        if (data) requ = JSON.parse(data);
        else requ = req.query;
        const resp = await callback(requ, currentUser);
        res.status(resp.code).type("application/json").send(resp.resp);
      } catch {
        const resp: ErrorResp = { error: "BadRequest" };
        res.status(400).type("application/json").send(resp);
      }
    });
  };

  // Routes
  routeBuilder("get", "userexists", async (req) => {
    if (!is<CheckUserExistsReq>(req))
      return { resp: { error: "BadRequest" }, code: 400 };

    const user = await User.findOne({ email: req.email });
    const resp: CheckUserExistsResp = { exists: user != null };
    return { resp, code: 200 };
  });
};
