import { httpRouter } from "convex/server";
import { polar } from "./billing";

const http = httpRouter();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
polar.registerRoutes(http as any);

export default http;
