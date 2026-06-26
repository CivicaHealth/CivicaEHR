# Deploying to AWS

This app ships as a single Docker image (root `Dockerfile`, multi-stage, Next.js
standalone output) plus an AWS RDS PostgreSQL database. Everything below assumes the goal
is a HIPAA-eligible setup, which is a combination of contractual (BAA) and technical
(encryption in transit/at rest, access control, audit logging) requirements -- the
technical side is mostly already handled by this codebase; this doc covers the
infrastructure side.

## 0. Before any real patient data exists anywhere in AWS

Accept AWS's **Business Associate Addendum (BAA)** in the [AWS Artifact
console](https://console.aws.amazon.com/artifact/) (Account Settings -> Agreements). This is
free, self-service, and takes a few minutes -- it is the legal precondition for using AWS
with PHI, not a technical step. Do this before step 2.

## 1. Database: RDS for PostgreSQL

1. Launch an RDS PostgreSQL instance (Multi-AZ recommended for real production use; a
   single-AZ `db.t4g.micro` is fine to get rolling). Keep **Public access: No**.
2. At creation time, enable:
   - **Storage encryption** (uses AWS KMS) -- encryption at rest.
   - A custom parameter group with **`rds.force_ssl = 1`** -- rejects any non-TLS connection.
3. Security group: only allow inbound 5432 from sources listed in section 1b below, never
   `0.0.0.0/0`, and never set "Public access" to Yes.
4. Note the endpoint hostname. The app already requires and verifies TLS for any
   non-localhost Postgres host (`packages/db/src/ssl.ts`, using the bundled AWS RDS CA
   chain) -- no extra connection-string flags needed.

### 1a. Outbound network path for ECS Fargate tasks (required before 1b or section 3)

Every command below uses `assignPublicIp=DISABLED` (tasks have no public IP -- correct for a
private app). That means each task's *outbound* traffic -- pulling the image from ECR,
reading secrets from Secrets Manager, and shipping logs to CloudWatch -- has nowhere to go
unless the VPC provides a path. Without one, tasks fail to even start (stuck `PROVISIONING`
or image-pull errors). Pick one before running anything in 1b or section 3:

- **NAT Gateway** in a public subnet, with the private subnets' route tables pointing
  default (`0.0.0.0/0`) traffic at it. Simplest to reason about, gives general internet
  egress, but has an hourly cost plus per-GB data processing charges.
- **VPC endpoints**, no internet egress at all (more in line with keeping everything
  private): interface endpoints for `com.amazonaws.<region>.ecr.api`,
  `com.amazonaws.<region>.ecr.dkr`, `com.amazonaws.<region>.secretsmanager`, and
  `com.amazonaws.<region>.logs`, plus a **gateway** endpoint (no hourly cost) for
  `com.amazonaws.<region>.s3` (ECR stores image layers in S3; the gateway endpoint covers
  that hop). Each interface endpoint has its own hourly cost, generally cheaper than a NAT
  Gateway at low traffic volumes but more pieces to set up.

Either choice is a **new billable AWS resource** -- per the constraints already agreed, pick
one and confirm before creating it rather than defaulting to whichever seems easier.

### 1b. Bootstrap the database and app role (private RDS -> via a one-off ECS task)

Because RDS has no public access, nothing outside its VPC can reach it -- not a laptop, not
Vercel. The bootstrap and migrations run via a **one-off ECS Fargate task** in the same VPC,
using the **`ops` image** (a separate build target from the app image -- see section 2;
the production app image does not have `psql` or working `npm run db:migrate` wiring, this
was verified directly rather than assumed). Order matters:

1. **Build/push both images to ECR first** (see section 2 below), so the task definition has
   something to run.
2. **Create an ECS task security group** (e.g. `civica-ecs-tasks`) -- it needs no inbound
   rules itself; it's only used as the *source* in RDS's rule below.
3. **Add one inbound rule to RDS's existing security group**: TCP 5432, source =
   `civica-ecs-tasks` security group. (Leave any temporary "my IP" rule in place until step 5
   below -- don't remove it yet.)
4. **Run the bootstrap SQL once**, via a one-off task using the **`civica-dashboard:ops`**
   image tag. `bootstrap-production.sql` is password-free and stays that way -- the new
   `civica_app` password is generated once and
   stored in Secrets Manager as its own secret (e.g. named `civica-app-db-password`), and
   the bootstrap task definition references it as an injected secret environment variable,
   `CIVICA_APP_PASSWORD` (alongside `DATABASE_URL_CONTROL_BOOTSTRAP`, the RDS **master**
   `postgres` connection string -- both secrets attached to this one-off task definition
   only, never to the long-running app task definition). At runtime the container expands
   both env vars itself; neither value appears in the override JSON below, in this repo, or
   in any log -- and the command does not enable `set -x` or otherwise echo what it runs:
   ```bash
   aws ecs run-task \
     --cluster civica \
     --task-definition civica-bootstrap \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-ids>],securityGroups=[<civica-ecs-tasks-sg-id>],assignPublicIp=DISABLED}" \
     --overrides '{"containerOverrides":[{"name":"civica-dashboard","command":["sh","-c","exec psql \"$DATABASE_URL_CONTROL_BOOTSTRAP\" -v ON_ERROR_STOP=1 -v app_password=\"$CIVICA_APP_PASSWORD\" -f packages/db/sql/bootstrap-production.sql"]}]}'
   ```
   The override's literal text only ever contains the *names* `$DATABASE_URL_CONTROL_BOOTSTRAP`
   / `$CIVICA_APP_PASSWORD` -- the actual values exist only inside the container's
   environment at runtime, injected by ECS from Secrets Manager.
5. **Run migrations**, via the same `civica-dashboard:ops`-image task definition but reading
   `DATABASE_URL_CONTROL` (the `civica_app` role -- the same secret the long-running app
   uses; the `ops` image's default `CMD` is already `npm run db:migrate`, so no override
   needed if you'd rather rely on the image default than spell it out below):
   ```bash
   aws ecs run-task \
     --cluster civica \
     --task-definition civica-bootstrap \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-ids>],securityGroups=[<civica-ecs-tasks-sg-id>],assignPublicIp=DISABLED}" \
     --overrides '{"containerOverrides":[{"name":"civica-dashboard","command":["npm","run","db:migrate"]}]}'
   ```
6. **Only after both runs succeed**, remove the temporary "my IP" rule from RDS's security
   group -- the `civica-ecs-tasks` rule from step 3 is all that should remain.

Skip `npm run db:setup`/`npm run db:seed` for production -- those are dev/demo helpers
(`db:setup` creates the local `civica_clinic_demo` database and `db:seed` inserts dev
credentials and demo data, neither appropriate for a real launch).

## 2. App image (two tags from one repo: the app, and a separate ops image)

The root `Dockerfile` has three build stages: `builder` (full repo + deps, not pushed
anywhere itself), `runner` (the default target if `--target` is omitted -- minimal
production app image, no `psql` or workspace script wiring), and `ops` (the `builder` stage
plus `psql`, used only for the one-off bootstrap/migrate task in 1b -- verified locally
before any AWS use, see below). Build and push both as tags in the same ECR repo:

```bash
aws ecr create-repository --repository-name civica-dashboard
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

docker build --target runner -t civica-dashboard:latest .
docker tag civica-dashboard:latest <account-id>.dkr.ecr.<region>.amazonaws.com/civica-dashboard:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/civica-dashboard:latest

docker build --target ops -t civica-dashboard:ops .
docker tag civica-dashboard:ops <account-id>.dkr.ecr.<region>.amazonaws.com/civica-dashboard:ops
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/civica-dashboard:ops
```

**Verify the `ops` image locally before using it against AWS at all:**
```bash
docker build --target ops -t civica-dashboard:ops .
docker run --rm civica-dashboard:ops sh -lc \
  'command -v psql && ls -l packages/db/sql/bootstrap-production.sql && ls -l package.json && npm run db:migrate --if-present || true'
```
Expect: a `psql` path, both files listed, and `npm run db:migrate` running far enough to
attempt (and fail, since there's no real database at this point) a connection -- not an
early "file not found" or "command not found" error.

The build stage uses placeholder env values purely to satisfy `next build`'s eager
`requireEnv()` checks (see comments in `Dockerfile`) -- no real secrets are ever baked into
either image (the `ops` image inherits the same build-time placeholders as a side effect of
building on top of `builder`, but ECS's injected real secrets override them at container
runtime, the same way any `-e`/task-definition env var overrides a Dockerfile `ENV`
default). The app (`runner`/`latest`) image only listens on `$PORT` (default 3000) and serves
`GET /api/health` (`{"status":"ok"}`) for load balancer health checks; it has no SQL client
and cannot run migrations -- a plain `docker build .` with no `--target` still produces this
image, since `runner` is the last stage in the Dockerfile. The `ops` image is never put
behind a load balancer and never runs as a long-lived service -- only as the one-off task in
1b, and must always be built with an explicit `--target ops`.

## 3. Running it: ECS Fargate (recommended)

ECS Fargate is on AWS's HIPAA-eligible services list and avoids managing EC2 instances.

1. Create an ECS cluster (Fargate launch type). The same cluster hosts both this
   long-running service and section 1b's one-off `civica-bootstrap` task definition.
2. Task definition (`civica-dashboard`): one container from the `civica-dashboard:latest`
   ECR image tag, port 3000, health check hitting `/api/health`.
3. Store every secret below in **AWS Secrets Manager** (or SSM Parameter Store) and reference
   them in the task definition's `secrets` block -- never as plain task-definition
   `environment` entries:
   - `DATABASE_URL_CONTROL`, `DIRECT_URL`, `TENANT_DATABASE_URL_TEMPLATE` (RDS endpoint, the
     `civica_app` role -- the same secret section 1b's migrate run reads)
   - `SESSION_SECRET`, `PASSWORD_PEPPER`, `CLINIC_CODE_LOOKUP_SALT` (generate fresh values
     for production with `openssl rand -base64 32` each -- do not reuse local dev values)
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`
   - `APP_URL` (the real public HTTPS URL) and `NODE_ENV=production` can be plain env vars,
     not secrets.
4. Put the service behind an **Application Load Balancer** with an ACM TLS certificate (HTTPS
   listener -> HTTP to the container is fine; session cookies use `secure` based on
   `NODE_ENV`, not the internal hop's protocol).
5. The `civica-bootstrap` task definition from section 1b is separate from this one (it uses
   the `civica-dashboard:ops` image tag, not `:latest`) but **shares the
   `DATABASE_URL_CONTROL` secret** with it -- only `DATABASE_URL_CONTROL_BOOTSTRAP` (master
   credentials) is unique to `civica-bootstrap`, attached to nothing else.

### 3a. IAM roles

ECS Fargate tasks have two distinct IAM roles -- don't conflate them:

- **Task execution role** (assumed by the ECS agent itself, to start the container -- not by
  your app code). Needs:
  - ECR pull permissions (`ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`,
    `ecr:GetDownloadUrlForLayer`, `ecr:BatchGetImage`) and CloudWatch Logs write permissions
    (`logs:CreateLogStream`, `logs:PutLogEvents`) -- both covered by attaching AWS's managed
    `AmazonECSTaskExecutionRolePolicy`.
  - `secretsmanager:GetSecretValue`, scoped to exactly the secret ARNs referenced in the task
    definition's `secrets` block -- **not** included in the managed policy above, must be
    added explicitly.
  - `kms:Decrypt`, scoped to that key's ARN, **only if** any of those secrets are encrypted
    with a customer-managed KMS key rather than the default AWS-managed
    `aws/secretsmanager` key.
  - This same execution role (with the same secrets-read permissions, scoped to its own
    secret ARNs) is what `civica-bootstrap`'s task definition needs too.
- **Task role** (assumed by the application code inside the container, for any AWS API calls
  *the app itself* makes). The running Next.js app doesn't call any AWS SDK APIs directly --
  it talks to Postgres over the standard wire protocol, not via AWS APIs -- so this role
  should stay **empty / minimal**, not broadened "just in case." Same for the `ops` task: it
  runs `psql`/`npm run db:migrate`, no AWS API calls from app code either.

## 4. Verifying the database bootstrap

After section 1b's two runs, confirm (e.g. by checking the bootstrap task's CloudWatch logs,
or by running these one more time via a throwaway `psql` override on the same task
definition with `DATABASE_URL_CONTROL`):
```sql
SELECT current_database(), current_user;                                   -- civica_control / civica_app
SELECT ssl, version, cipher FROM pg_stat_ssl WHERE pid = pg_backend_pid();  -- ssl = t
```
Also confirm: the RDS security group no longer has the temporary "my IP" rule, the ECS task
definition's `secrets` block (not `environment`) is what holds every credential, and no
password appears in any CloudWatch log group for these runs.

## 5. Create the first platform admin account

There's no public registration for platform admins (only `clinic_admin`/`member` self-serve
via a clinic registration code -- see `REQUESTABLE_ROLES` in
`apps/dashboard/src/lib/validation/auth.ts`). The very first platform admin is created via
`packages/db/src/scripts/create-platform-admin.ts`, run once via the same `ops` image/task
definition as the migrate step, reading credentials from env vars -- never hardcoded:

```bash
aws ecs run-task \
  --cluster civica \
  --task-definition civica-bootstrap \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-ids>],securityGroups=[<civica-ecs-tasks-sg-id>],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"civica-dashboard","command":["npm","run","create:platform-admin","-w","@civica/db"],"environment":[{"name":"CIVICA_MASTER_ADMIN_EMAIL","value":"<the real admin email>"}]}]}'
```
`CIVICA_MASTER_ADMIN_TEMP_PASSWORD` should come from Secrets Manager via the task
definition's `secrets` block, not as a plain override value like the email above (the email
isn't sensitive; the password is). Generate it (e.g. `openssl rand -base64 18`) and store it
in Secrets Manager before running this -- it's never printed, logged, or committed anywhere,
including by the script itself.

This is idempotent (safe to re-run, e.g. to reset the password) and uses the same
`hashPassword`/`verifyPassword` the real `/login` flow uses -- it does not add a login
bypass or any new comparison logic. It sets `users.isPlatformAdmin = true`, which is this
codebase's actual cross-clinic admin check (`canAccessTool` in
`packages/permissions/src/authorize.ts`); the `roles`/`permissions`/`role_permissions` tables
are explicitly unused scaffolding for future fine-grained authorization (see the comment on
the `permissions` table), so this script does not populate `role_permissions` -- doing so
would imply a security guarantee that isn't actually enforced by anything yet.

## 6. Day-2 notes

- Rotate `SESSION_SECRET`/`PASSWORD_PEPPER`/`CLINIC_CODE_LOOKUP_SALT` and any SMTP API key
  immediately if they were ever committed to git or shared outside Secrets Manager.
- RDS automated backups are encrypted automatically once storage encryption is on; keep the
  default 7+ day retention.
- Audit log: every sensitive action already writes to the control DB via `logAuditEvent`
  (`@civica/audit`) -- nothing extra to wire up for that.
- `civica_app` currently has both DDL (migration) and DML (runtime) privileges since it owns
  the database/schema -- a deliberate MVP simplification, not least-privilege best practice.
  A stricter setup would split this into a `civica_migrator` role (DDL only) and a narrower
  `civica_app` (DML only), so a compromised running app couldn't alter schema. Revisit if/when
  that risk matters more than deployment simplicity.
