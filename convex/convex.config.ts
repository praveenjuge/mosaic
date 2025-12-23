import { defineApp } from "convex/server";
import r2 from "@convex-dev/r2/convex.config.js";
import polar from "@convex-dev/polar/convex.config.js";

const app = defineApp();
app.use(r2);
app.use(polar);

export default app;