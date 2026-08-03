#!/usr/bin/env node
import { createProgram } from "./cli/program.js";

const program = createProgram();

if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse(process.argv);
}
