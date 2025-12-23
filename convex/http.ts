import { httpRouter } from "convex/server";
import { polar } from "./billing";

const http = httpRouter();

polar.registerRoutes(http as any);

export default http;