import { app } from "./main";
import { DiningHall, Meal, User } from "./models";

import { equals, is } from "typia";
import { genSaltSync, hashSync, compareSync } from "bcrypt";
import { v4 } from "uuid";
import {
  Endpoint,
  Method,
  Resp,
  Authorization,
  ErrorResp,
  CheckUserExistsReq,
  CheckUserExistsResp,
  SignInReq,
  SignUpInResp,
  SignUpReq,
  DiningHallReq,
  MealReq,
  MealAggReq,
  UserReq,
  ChangeUserPropReq,
} from "./FoodScoopAppTypes/re";

const BASEROUTE = "/api/v1/";
const route = (endpoint: Endpoint) => BASEROUTE + endpoint;
const badRequestError: { resp: ErrorResp; code: number } = {
  resp: { error: "BadRequest" },
  code: 400,
};

/**
 * Creates routes based on types defined in re.d.ts
 * @param {Method} type HTTP method: get, post or delete
 * @param {Endpoint} endpoint Last item in HTTP request path
 * @param {RouteBuilderCallback} callback Calls when matched response is made by a client
 * @param {boolean} authRequired If route requires authentication
 */
const routeBuilder = (
  type: Method,
  endpoint: Endpoint,
  callback: (
    req: any,
    currentUser?: string //
  ) => Promise<{ resp: Resp; code: number }>,
  authRequired?: boolean
) => {
  // Define express route
  app[type](route(endpoint), async (req, res) => {
    // Variable to return auth'ed user if exists
    let currentUser: string | undefined;

    // Output request metadata to logs
    console.debug();
    console.debug(req.ip, req.path, req.query, req.body);

    // Need to verify user is user
    if (authRequired) {
      let resp: Resp = { error: "Unauthorized" };

      // If we don't have authorization headers
      if (!req.headers.authorization) {
        console.debug(resp);
        res.status(401).type("application/json").send(resp);
        return;
      }

      resp.error = "BadRequest";

      // Attempt to parse auth headers
      try {
        const auth = JSON.parse(req.headers.authorization as string);

        // Is not of authorization type, bad data
        if (!is<Authorization>(auth)) {
          console.debug(resp);
          res.status(400).type("application/json").send(resp);
          return;
        }

        // Find user in database
        const user = await User.findOne({
          email: auth.username,
          tokens: auth.password,
        });

        // No user found, is unauthorized
        if (user == null) {
          resp.error = "Unauthorized";
          console.debug(resp);
          res.status(401).type("application/json").send(resp);
          return;
        }

        // Potentially return current user with response
        currentUser = user.email;
      } catch {
        // Auth headers are not of JSON type
        console.debug(resp);
        res.status(400).type("application/json").send(resp);
        return;
      }
    }

    // Either authorization went through or is not required
    try {
      // Create object to store request
      let requ: any = {};

      // Attempt to read and parse JSON data
      if (Object.keys(req.body).length > 0) requ = req.body;
      // If there is no data, just use the query string
      else requ = req.query;

      // Check if request is of type asked for, if not, bad request
      /* As of 3/3/23, Typia does not support generic type checking */
      // let resp: any = { resp: { error: "BadRequest" }, code: 400 };
      // if (!is<T>(requ)) {
      //   res.status(resp.code).type("application/json").send(resp.resp);
      //   return;
      // }

      // Use callback to generate response
      let resp = await callback(requ, currentUser);

      // Store response in log
      console.debug(resp);

      // Send to user
      res.status(resp.code).type("application/json").send(resp.resp);
    } catch (err) {
      // Error with server
      console.debug(err)
      const resp: ErrorResp = { error: "InternalServer" };
      res.status(400).type("application/json").send(resp);
    }
  });
};
/**
 * Calls when matched response is made by a client
 * @callback RouteBuilderCallback
 * @param resp Returns a request of given type
 * @param currentUser And if auth required, gives the auth'ed user
 * @returns An object of a Resp type and the HTTP status code
 */

/* Routes */

routeBuilder("get", "userexists", async (req) => {
  if (!is<CheckUserExistsReq>(req)) return badRequestError;
  const user = await User.findOne({ email: req.email });
  const resp: CheckUserExistsResp = { exists: user != null && user.email == req.email };
  return { resp, code: 200 };
});

routeBuilder("post", "signup", async (req) => {
  if (!is<SignUpReq>(req)) return badRequestError;

  let user = await User.findOne({ email: req.email });
  if (user) {
    const resp: ErrorResp = { error: "AlreadyExists" };
    return { resp, code: 403 };
  }

  const salt = genSaltSync(10);
  const hash = hashSync(req.password, salt);

  const token = v4();
  await User.create({
    email: req.email,
    name: req.name,
    hash: hash,
    tokens: [token]
  });

  const resp: SignUpInResp = { token };
  return { resp, code: 200 };
});

routeBuilder("post", "signin", async (req) => {
  if (!is<SignInReq>(req)) return badRequestError;

  let user = await User.findOne({ email: req.email });

  if (!user) {
    const resp: ErrorResp = { error: "NotSignedUp" };
    return { resp, code: 400 };
  }

  if (!compareSync(req.password, user.hash)) {
    const resp: ErrorResp = { error: "WrongPassword" };
    return { resp, code: 403 };
  }

  const token = v4();
  user.tokens ? user.tokens.push(token) : (user.tokens = [token]);
  user.save();

  const resp: SignUpInResp = { token };
  return { resp, code: 200 };
});

routeBuilder("get", "dininghall", async (req) => {
  if (!is<DiningHallReq>(req)) return badRequestError;

  let dh = await DiningHall.findOne({ name: req.diningHallName, date: req.date });
  if (!dh) return { resp: { error: "NotFound" }, code: 404 };

  return { resp: { diningHall: dh.toJSON() }, code: 200 };
});

routeBuilder("get", "meal", async (req) => {
  if (!is<MealReq>(req)) return badRequestError;

  let meal = await Meal.findOne({ name: req.mealID });
  if (!meal) return { resp: { error: "NotFound" }, code: 404 };

  return { resp: { meal: meal.toJSON() }, code: 200 };
});

routeBuilder("get", "mealagg", async (req) => {
  if (!is<MealAggReq>(req)) return badRequestError;

  let meals = await Meal.find({ id: req.mealIDs });
  if (meals.length < req.mealIDs.length) {
    return { resp: { error: "NotFound" }, code: 404 };
  }

  return { resp: { meals: meals.map((x) => x.toJSON()) }, code: 200 };
});

routeBuilder(
  "get",
  "user",
  async (_, currentUser) => {
    let user = await User.findOne({ email: currentUser });
    if (!user) return { resp: { error: "NotFound" }, code: 404 };

    const userSend = user.toJSON();
    userSend.hash = "";
    userSend.notificationTokens = [];
    userSend.tokens = [];

    return { resp: { user: userSend }, code: 200 };
  },
  true
);

routeBuilder(
  "post",
  "updateuser",
  async (req, currentUser) => {
    if (!equals<ChangeUserPropReq>(req)) return badRequestError;

    let user = await User.findOne({ email: currentUser });
    if (!user) return { resp: { error: "NotFound" }, code: 404 };

    user.set(req);
    try {
      await user.save();
    } catch {
      return { resp: { error: "BadRequest" }, code: 400 };
    }

    return { resp: { success: true }, code: 200 };
  },
  true
);
