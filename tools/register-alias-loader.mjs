// tools/register-alias-loader.mjs
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("./tools/alias-loader.mjs", pathToFileURL("./"));
