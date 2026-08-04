#!/usr/bin/env node
import { createProgram } from "./cli/program.js";

const program = createProgram();

// Sans argument, `snaprun` exécute désormais l'action par défaut (RFC-010) :
// capture tous les runs. L'aide reste disponible via `--help`/`-h`.
program.parse(process.argv);
