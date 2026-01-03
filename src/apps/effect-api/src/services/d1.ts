import { Context } from "effect";
import type { D1Database } from "@cloudflare/workers-types";

export class D1 extends Context.Tag("D1")<D1, D1Database>() { }
