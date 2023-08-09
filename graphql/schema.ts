import "./types/Document";
import "./types/User";
import { builder } from "./builder";

export const schema = builder.toSchema();
