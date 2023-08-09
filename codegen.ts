import type { CodegenConfig } from "@graphql-codegen/cli";
import { printSchema } from "graphql";
import { schema } from "./graphql/schema";

const config: CodegenConfig = {
  schema: printSchema(schema),
  documents: ["app/**/*.tsx", "components/**/*.tsx", "lib/**/*.tsx"],
  generates: {
    "./graphql/__generated__/": {
      preset: "client",
      plugins: [],
    },
  },
};

export default config;
