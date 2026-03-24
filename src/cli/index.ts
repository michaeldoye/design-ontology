#!/usr/bin/env node

import { Command } from "commander";
import { registerValidateCommand } from "./validate.js";
import { registerInitCommand } from "./init.js";
import { registerUpdateCommand } from "./update.js";

const program = new Command();

program
  .name("design-ontology")
  .description(
    "Generate, validate, and evolve design ontologies — machine-traversable knowledge graphs encoding the reasoning behind design decisions."
  )
  .version("0.1.2");

registerValidateCommand(program);
registerInitCommand(program);
registerUpdateCommand(program);

program.parse();
