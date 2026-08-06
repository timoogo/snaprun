# SnapRun

SnapRun is a TypeScript CLI for Next.js route discovery and screenshot capture. It can scan
App Router and Pages Router projects, load a JSON configuration, optionally start the
application, authenticate through a form, and save Playwright screenshots with predictable
output structures.

## Requirements

- Node.js 20+
- pnpm
- Chromium for Playwright: `pnpm exec playwright install chromium`

## Install

For local development:

```bash
pnpm install
pnpm exec playwright install chromium
pnpm build
```

The published npm package exposes the `snaprun` binary:

```bash
npm install @timoogo/snaprun
npx snaprun --help
```

## Quick Start

```bash
cd my-nextjs-project
snaprun scan
# edit snaprun.config.json to enable routes and set project.baseUrl
snaprun
```

## Configuration Resolution

SnapRun resolves configuration files in this order:

1. `--config <path>`
2. a remembered project config stored in `.snaprun/project.json`
3. conventional file names in the current directory:
   - `snaprun.config.json`
   - `.snaprun.json`
   - `snapshot.config.json`
   - `settings.json`

When you run SnapRun with an explicit configuration path, the validated path is remembered for
the current project:

```json
{
  "configPath": "./config/snaprun.json"
}
```

This metadata is local project state. In most teams it should be ignored rather than committed.
SnapRun does not modify `.gitignore` automatically.

## Configuration File

```jsonc
{
  "project": {
    "root": ".", // relative to the configuration file
    "workingDirectory": ".", // relative to project.root
    "baseUrl": "http://localhost:3000",
    "startCommand": "pnpm dev",
    "autoStart": false
  },
  "output": {
    "directory": "./artifacts/snaprun",
    "fullPage": true,
    "structure": "flat" // flat | run | scope
  },
  "auth": {
    "loginRoute": "/login",
    "selectors": {
      "email": "input[name='email']",
      "password": "input[name='password']",
      "submit": "button[type='submit']"
    },
    "successUrl": "**/dashboard",
    "users": {
      "member": {
        "email": "member@example.com",
        "password": "${MEMBER_PASSWORD}"
      }
    }
  },
  "routes": [
    {
      "id": "home",
      "path": "/",
      "scope": "public",
      "enableSnapshot": true
    }
  ],
  "runs": []
}
```

Only the `project` section is required. `output.structure` defaults to `flat`.

### Secrets

Any configuration value may reference an environment variable:

```json
{ "password": "${MEMBER_PASSWORD}" }
```

Resolution order:

1. `process.env`
2. `.env.local` in `project.workingDirectory`
3. `.env` in `project.workingDirectory`

## CLI

Capture snapshots:

```bash
snaprun
snaprun --config ./config/snaprun.json
snaprun --runName member
snaprun --route /member/stays --user member
```

Discover routes:

```bash
snaprun scan
snaprun scan --default=enabled
```

### Options

- `--config <path>`: load a specific configuration file
- `--debug`: print the full stack trace and original cause
- `--runName <name>`: capture only one configured run
- `--partial`: requires `--runName`; currently retained for CLI compatibility and does not change route selection
- `--route <path>`: capture one configured route by path
- `--user <name>`: use this user when capturing a route outside a run
- `scan --default <enabled|disabled>`: set `enableSnapshot` for newly discovered routes

## Screenshot Output Structures

### `flat`

Backward-compatible historical layout:

```text
artifacts/snaprun/
├── member/
│   └── 01-member-home.png
└── standalone/
    └── home.png
```

### `run`

Each execution gets a timestamped folder:

```text
artifacts/snaprun/
└── run/
    └── 2026-08-06_1856/
        ├── home/
        │   └── page.png
        └── member-stays/
            └── page.png
```

### `scope`

Routes are grouped by functional scope:

```text
artifacts/snaprun/
├── public/
│   └── home/
│       └── page.png
└── member/
    └── member-stays/
        └── page.png
```

Routes without `scope` are stored under `unscoped/`.

## Route Model

Static route:

```json
{
  "id": "member-calendar",
  "path": "/member/calendar",
  "scope": "member",
  "enableSnapshot": true,
  "user": "member"
}
```

Dynamic route:

```json
{
  "id": "member-stay",
  "path": "/member/stays/[stayId]",
  "isDynamic": true,
  "parameters": { "stayId": "seed-stay-123" },
  "scope": "member",
  "enableSnapshot": true,
  "user": "member"
}
```

Notes:

- `snapshotPath` overrides only the final visited URL.
- `scope` is optional and accepts any string.
- invalid path segments are rejected before SnapRun writes outside the configured output directory.

## Authentication

The `auth` section is optional. When it is present, SnapRun performs generic HTML form login:
it fills `selectors.email` and `selectors.password`, clicks `selectors.submit`, then waits for
`successUrl` and/or `successSelector`.

Authentication is cached per Playwright `BrowserContext`, not globally. A user logs in once per
run context, and that session is reused for every route captured in the same run. Standalone
routes use their own isolated contexts, so they authenticate independently. Failed login attempts
never mark a context as authenticated.

At least one success criterion must be configured:

- `successUrl`
- `successSelector`

Secrets may be provided literally or through `${VARIABLE}` placeholders resolved at login time.
They are never echoed back in user-facing error messages.

## Application Lifecycle

Before capturing screenshots, SnapRun checks whether `project.baseUrl` already responds. Any HTTP
response counts as available, regardless of status code.

If an application is already running at `baseUrl`, SnapRun reuses it as-is and never stops it.
If `baseUrl` is unreachable and `project.autoStart` is `true`, SnapRun launches
`project.startCommand` from `project.workingDirectory`, waits for readiness, runs the capture, and
then stops only the process it started itself.

This means:

- an already-running external application is always reused and never shut down by SnapRun;
- auto-start requires `project.startCommand`;
- stdout and stderr from the started process are captured for diagnostics on startup failure;
- shutdown is handled in `finally`, including signal-driven exits, to avoid leaving child
  processes behind.

## Capture Command

```bash
snaprun
snaprun --config ./snapshot.config.json
snaprun --runName member
snaprun --runName member --partial
snaprun --route /member/calendar --user member
snaprun --runName member --route /member/calendar
snaprun --debug
```

Current behavior:

- `snaprun`: capture all configured runs in `order`, then any enabled standalone routes.
- `--runName <name>`: capture only that run.
- `--partial`: requires `--runName`; in the current version it is retained as part of the CLI
  surface but does not change route selection compared with a normal named run.
- `--route <path>`: capture a single configured route by path, outside any run by default.
- `--user <name>`: applies only with `--route` outside a run and overrides the route user for
  that one capture.
- `--runName <name> --route <path>`: capture exactly one route within the selected run.
- `--debug`: include stack trace and root cause information in CLI error output.

Forbidden combinations are rejected before SnapRun touches configuration, Playwright, or the
application process:

- `--partial` without `--runName`
- `--user` without `--route`
- `--user` combined with `--runName`

## Error Behavior

SnapRun uses fail-fast screenshot execution. The first capture failure stops the run and produces
a non-zero exit status, while still reporting any screenshots that completed successfully before
the failure.

Important error categories include:

- configuration lookup and validation errors such as `CONFIG_NOT_FOUND` and `CONFIG_INVALID`
- CLI option conflicts such as `CLI_OPTION_CONFLICT`
- route and run selection errors such as `ROUTE_NOT_FOUND` and `RUN_NOT_FOUND`
- dynamic route parameter errors such as `DYNAMIC_PARAMETER_MISSING` and
  `DYNAMIC_PARAMETER_UNKNOWN`
- authentication errors such as `USER_NOT_FOUND` and `AUTHENTICATION_FAILED`
- capture and application lifecycle errors such as `SNAPSHOT_FAILED`, `BASE_URL_MISSING`,
  `APPLICATION_START_FAILED`, and `APPLICATION_UNREACHABLE`

## Example Configuration

A complete example is available in [examples/snapshot.config.json](./examples/snapshot.config.json).

## Exit Status

- `0`: full success
- `1`: configuration error, CLI option conflict, application startup issue, or failed snapshots

## Known Limitations

Current scope is intentionally limited:

- Chromium only
- no visual diffing between screenshots
- no PDF or video export
- no viewport matrix or theme matrix
- no plugin system
- catch-all routes are detected but not auto-configured
- `--partial` is currently a compatibility option and behaves like a normal named run

## Development Scripts

- `pnpm build`: compile the TypeScript project
- `pnpm typecheck`: run TypeScript without emitting files
- `pnpm lint`: run ESLint
- `pnpm test`: run Vitest
- `pnpm format`: run Prettier

## Version Generation

`src/generated/version.ts` is generated from `package.json` before `build`, `typecheck`, `lint`,
and `test`. This keeps CLI name, version, and description available at runtime without reading
`package.json` directly from the published binary.

## Architecture References

The project specification and implementation decisions live under [`RFCs/`](./RFCs), especially:

- [`RFCs/README.md`](./RFCs/README.md)
- [`RFCs/DECISIONS.md`](./RFCs/DECISIONS.md)
