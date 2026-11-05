# Деплой car-calculator в AWS — чеклист консолі

Покрокова інструкція для корпоративного акаунта GoIT (IAM user + MFA, без
access keys, термінал — лише CloudShell). Робимо **по порядку**: кожен крок
залежить від попередніх. 📸 — зробити скріншот для звіту.

- Регіон: **US East (N. Virginia) `us-east-1`** — перевіряти праворуч угорі перед кожним кроком.
- Гілка коду: `deploy/aws` (прод на Render/Vercel/Neon не зачіпається).

## 0. Назви ресурсів (щоб не плутатись)

| Ресурс | Назва |
|---|---|
| VPC | `car-calc-matiushko-vpc` |
| Security groups | `car-calc-alb-sg-matiushko`, `car-calc-ecs-sg-matiushko`, `car-calc-rds-sg-matiushko` |
| S3 bucket | `focc-car-calc-avatars-matiushko` (ім'я глобально унікальне) |
| IAM roles | `focc-ecs-task-execution-matiushko`, `focc-ecs-task-matiushko` |
| RDS | `car-calc-db-matiushko` |
| Secret | `focc-car-calc-backend-matiushko` |
| ECR | `car-calc-backend-matiushko`, `car-calc-frontend-matiushko` |
| Log groups | `/ecs/car-calc-backend-matiushko`, `/ecs/car-calc-frontend-matiushko` |
| ALB / target groups | `car-calc-alb` / `car-calc-backend-tg`, `car-calc-frontend-tg` |
| ECS cluster / services | `car-calc-cluster` / `car-calc-backend`, `car-calc-frontend` |
| SNS topic | `car-calc-alerts` |

> **Нотатки по ходу.** Ведіть собі файлик зі значеннями, які знадобляться далі:
> VPC ID, subnet IDs, SG IDs, RDS endpoint, Secret ARN, ALB DNS name.

## Архітектура (коротко)

```
Інтернет ─► ALB (публічні підмережі, 2 AZ, SG: 80 з 0.0.0.0/0)
             ├─ /api/*  ─► ECS Fargate: backend  (NestJS, :3000) ─┬─► RDS PostgreSQL (приватні підмережі)
             └─ /*      ─► ECS Fargate: frontend (nginx, :80)     └─► S3 (аватарки, приватний бакет)
ECR (образи) · Secrets Manager (секрети) · CloudWatch (логи, метрики, алярми) ─► SNS (email)
```

Чому таски в **публічних** підмережах: NAT Gateway коштує ~$32/міс. Таски мають
публічний IP лише для вихідного трафіку (ECR, S3, AUTO.RIA, Brevo), а вхідний
дозволено **тільки від ALB** (SG). БД — у приватних підмережах без доступу з
інтернету. У продакшні таски були б у приватних підмережах за NAT/VPC endpoints.

---

## 1. S3 — бакет для аватарок

S3 → **Create bucket**
- Bucket type: General purpose · Name: `focc-car-calc-avatars-matiushko`
- Object Ownership: ACLs disabled
- **Block all public access: ✅ увімкнено** (файли віддає бекенд)
- Versioning: disabled · Encryption: SSE-S3 (дефолт)
- 📸 сторінка бакета (Properties / Permissions з Block public access)

## 2. IAM — дві ролі (префікс `focc-` + boundary!)

Для **кожної** ролі: IAM → Roles → **Create role**
→ Trusted entity: *AWS service* → Use case: **Elastic Container Service** →
**Elastic Container Service Task** → Next
→ додати policy (нижче) → розгорнути **Set permissions boundary** →
*Use a permissions boundary…* → `Foundations-of-Cloud-Computing-lab-scope` → Next
→ назва → Create. Потім вкладка **Trust relationships** — має бути `ecs-tasks.amazonaws.com`.

| Роль | Policies | Для чого |
|---|---|---|
| `focc-ecs-task-execution-matiushko` | `AmazonECSTaskExecutionRolePolicy`, `SecretsManagerReadWrite` | ECS агент: тягне образ з ECR, пише логи, читає секрети |
| `focc-ecs-task-matiushko` | `AmazonS3FullAccess` | Сам застосунок: PutObject/GetObject в S3 |

> Власні (least-privilege) policy в акаунті створювати не можна, тому керовані.
> Права додатково обрізає boundary. У документації описуємо, яка policy була б у
> продакшні (лише `s3:GetObject/PutObject` на `arn:aws:s3:::<bucket>/avatars/*`).
>
> ⚠️ Якщо прикріпити `SecretsManagerReadWrite` не дасть (AccessDenied) — без неї;
> тоді в кроці 11 секрети задаємо як звичайні env (план Б, описати в звіті).

📸 обидві ролі (Permissions + Permissions boundary).

## 3. VPC — мережа

VPC → **Create VPC** → **VPC and more**
- Name tag auto-generation: `car-calc` · IPv4 CIDR: `10.0.0.0/16`
- Number of AZs: **2** · Public subnets: **2** · Private subnets: **2**
- **NAT gateways: None** · VPC endpoints: **None**
- DNS hostnames ✅ · DNS resolution ✅
- Create → 📸 Resource map (схема VPC/підмереж/route tables)

Після створення: VPC → Subnets → обидві **public** підмережі → Actions →
*Edit subnet settings* → ✅ **Enable auto-assign public IPv4 address**.

## 4. Security Groups

EC2 → Security Groups → **Create security group** (VPC: `car-calc-matiushko-vpc`), по черзі:

| SG | Inbound | Source |
|---|---|---|
| `car-calc-alb-sg-matiushko` | HTTP 80 | `0.0.0.0/0` |
| `car-calc-ecs-sg-matiushko` | Custom TCP 3000 | `car-calc-alb-sg-matiushko` |
|  | HTTP 80 | `car-calc-alb-sg-matiushko` |
| `car-calc-rds-sg-matiushko` | PostgreSQL 5432 | `car-calc-ecs-sg-matiushko` |

Outbound у всіх — дефолт (All traffic). 📸 inbound rules кожної SG.

## 5. RDS — PostgreSQL

**5.1.** RDS → Subnet groups → **Create DB subnet group**: `car-calc-db-subnets-matiushko`,
VPC `car-calc-matiushko-vpc`, обидві AZ, лише **private** підмережі.

**5.2.** RDS → **Create database** → Standard create
- Engine: **PostgreSQL** (остання 17.x) · Template: **Free tier** (або Dev/Test → Single-AZ)
- DB instance identifier: `car-calc-db-matiushko`
- Master username: `postgres` · Credentials management: **Self managed**,
  пароль **лише з літер і цифр** (≥ 20 символів) — він піде в URL; збережіть його
- Instance: **db.t4g.micro** · Storage: gp3, **20 GiB**, autoscaling вимкнути
- Connectivity: VPC `car-calc-matiushko-vpc`, subnet group `car-calc-db-subnets-matiushko`,
  **Public access: No**, SG: `car-calc-rds-sg-matiushko` (прибрати `default`)
- Database authentication: Password
- Monitoring: Performance Insights — вимкнути (економія)
- Additional configuration → **Initial database name: `car_calculator`**,
  Backup retention: 1 day, Encryption ✅
- Create (≈10 хв) → скопіювати **Endpoint** · 📸 Connectivity & security

## 6. Secrets Manager — секрети бекенду

Secrets Manager → **Store a new secret** → *Other type of secret* → Key/value:

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:<PASS>@<RDS_ENDPOINT>:5432/car_calculator?sslmode=no-verify` |
| `DIRECT_URL` | `postgresql://postgres:<PASS>@<RDS_ENDPOINT>:5432/car_calculator?sslmode=require` |
| `JWT_ACCESS_SECRET` | 64 hex-символи (див. нижче) |
| `JWT_REFRESH_SECRET` | інші 64 hex-символи |
| `BREVO_API_KEY` | ваш ключ Brevo (той самий, що на Render) |

Secret name: `focc-car-calc-backend-matiushko` → Store → скопіювати **Secret ARN**. 📸

Згенерувати JWT-секрети (CloudShell): `openssl rand -hex 32` (двічі).

> **Чому два URL.** RDS вимагає SSL. Драйвер `pg` (рантайм) трактує
> `sslmode=require` як повну перевірку сертифіката, а CA RDS немає в довірених
> у Node → `no-verify` (шифрування є, трафік не виходить за межі VPC). Міграції
> Prisma (`DIRECT_URL`) працюють зі звичайним `require`.

## 7. CloudWatch — log groups

CloudWatch → Logs → Log groups → **Create log group**:
`/ecs/car-calc-backend-matiushko` і `/ecs/car-calc-frontend-matiushko`, Retention: **1 week**.

## 8. ECR — репозиторії образів

ECR → Private registry → **Create repository**: `car-calc-backend-matiushko`, потім
`car-calc-frontend-matiushko` (Image scan on push ✅, tag mutability: Mutable).

## 9. CloudShell — збірка і push образів

Іконка CloudShell у верхній панелі консолі (регіон us-east-1):

```bash
git clone -b deploy/aws https://github.com/Vi-encore/car-calculator.git
cd car-calculator
bash infra/aws/build-and-push.sh
```

Скрипт логіниться в ECR, збирає обидва образи і пушить теги `latest` та
`<git-sha>`. Збірка займає 5–15 хв. Якщо `no space left on device` —
`docker system prune -af` і запустити ще раз (скрипт чистить після кожного образу).

Оновлення після нових комітів: `cd car-calculator && git pull && bash infra/aws/build-and-push.sh`,
потім ECS → service → **Update → Force new deployment**.

📸 ECR → репозиторій → Images.

## 10. ALB — балансувальник

**10.1. Target groups** (EC2 → Target Groups → Create), обидві: target type
**IP addresses**, VPC `car-calc-matiushko-vpc`, protocol HTTP, **без реєстрації таргетів** (ECS зробить сам):

| Target group | Port | Health check path |
|---|---|---|
| `car-calc-backend-tg` | 3000 | `/api/health` |
| `car-calc-frontend-tg` | 80 | `/health` |

Advanced health check: healthy threshold 2, interval 15s.

**10.2.** EC2 → Load Balancers → **Create** → Application Load Balancer
- Name `car-calc-alb` · **Internet-facing** · IPv4
- VPC `car-calc-matiushko-vpc`, обидві AZ → **public** підмережі
- SG: `car-calc-alb-sg-matiushko` (прибрати `default`)
- Listener HTTP:80 → default action: forward to `car-calc-frontend-tg`
- Create → скопіювати **DNS name** (`car-calc-alb-…us-east-1.elb.amazonaws.com`)

**10.3.** Listener HTTP:80 → **Add rule** → Name `api` → Condition **Path** =
`/api/*` → Forward to `car-calc-backend-tg` → Priority **10**.

📸 Listener rules + Resource map ALB.

## 11. ECS — кластер, task definitions, сервіси

**11.1.** ECS → Clusters → **Create cluster**: `car-calc-cluster`,
Infrastructure: **AWS Fargate** (serverless) only. Monitoring → **Container
Insights: ✅** (метрики CPU/пам'яті тасків для дашборду).

**11.2. Task definitions** → Create new → **Create with JSON**: вставити
[`taskdef-backend.json`](taskdef-backend.json) та
[`taskdef-frontend.json`](taskdef-frontend.json), попередньо замінивши
плейсхолдери `<…>` (ALB DNS, bucket, Secret ARN, MAIL_FROM).

> **План Б** (якщо execution role не має доступу до секретів): у backend-JSON
> прибрати блок `secrets` і додати ці ж 5 значень у `environment`. Описати в
> звіті як обмеження акаунта.

**11.3. Сервіси** (кластер → Services → **Create**), для кожного:
- Compute: **Launch type FARGATE**, platform LATEST
- Application type: Service · Task definition: відповідна, остання ревізія
- Service name `car-calc-backend` / `car-calc-frontend` · Desired tasks: **1**
- Networking: VPC `car-calc-matiushko-vpc`, **public** підмережі, SG `car-calc-ecs-sg-matiushko`,
  **Public IP: ON**
- Load balancing: Application Load Balancer → existing `car-calc-alb` →
  container `backend 3000` / `frontend 80` → existing listener 80 →
  existing target group `car-calc-backend-tg` / `car-calc-frontend-tg`
- Backend: **Health check grace period 120 s** (на старті — міграції)
- Service auto scaling — налаштуємо в кроці 13

Перевірка: Target groups → Targets = **healthy**; логи в CloudWatch
`/ecs/car-calc-backend-matiushko` (має бути `prisma migrate deploy` і `Nest application successfully started`).

📸 кластер (Services: Running 1/1), task details, target groups healthy.

## 12. Перевірка застосунку

- `http://<ALB_DNS>/` — фронт · `http://<ALB_DNS>/api/health` → `{"status":"ok"}`
- Реєстрація → вхід → розрахунок → історія → профіль → **аватарка** (має
  з'явитися об'єкт у S3 `avatars/<userId>/…`). Кнопка Google — неактивна.
- 📸 застосунок у браузері з URL ALB, об'єкт у S3.

## 13. Auto Scaling

ECS → `car-calc-backend` → **Update service** → Service auto scaling ✅
- Min **1**, Desired **1**, Max **3**
- Policy 1 (target tracking): `cpu-50`, metric **ECSServiceAverageCPUUtilization**, target **50**
- Policy 2 (target tracking): `req-per-target`, metric **ALBRequestCountPerTarget**
  (target group `car-calc-backend-tg`), target **1000**
- Scale-out cooldown 60 s, scale-in cooldown 120 s

Те саме для `car-calc-frontend` (лише CPU-політика, max 2 — за бажанням).

> Якщо помилка про service-linked role `AWSServiceRoleForApplicationAutoScaling_ECSService`
> — скріншот і в Slack ментору (студент не може її створити).

📸 вкладка Service auto scaling.

## 14. Моніторинг: SNS + алярми + дашборд

**14.1.** SNS → Topics → **Create topic**: Standard, `car-calc-alerts` →
**Create subscription**: Email → ваш email → **підтвердити лист**. 📸

**14.2.** CloudWatch → Alarms → **Create alarm** (дія: notify `car-calc-alerts`):

| Alarm | Metric | Умова |
|---|---|---|
| `car-calc-alb-5xx` | ApplicationELB → per-LB → `HTTPCode_Target_5XX_Count` (Sum, 5 хв) | ≥ 10 |
| `car-calc-backend-unhealthy` | ApplicationELB → per-TG → `UnHealthyHostCount` (`car-calc-backend-tg`, Max, 1 хв) | ≥ 1 (2 з 2 точок) |
| `car-calc-backend-cpu-high` | ECS → ClusterName, ServiceName → `CPUUtilization` (Avg, 5 хв) | > 80 |
| `car-calc-rds-cpu-high` | RDS → `car-calc-db-matiushko` → `CPUUtilization` (Avg, 5 хв) | > 80 |
| `car-calc-rds-storage-low` | RDS → `FreeStorageSpace` (Min, 5 хв) | < 2 GB (2147483648) |

**14.3.** CloudWatch → Dashboards → **Create** `car-calc`: віджети ALB
RequestCount + TargetResponseTime + 5XX, ECS CPU/Memory обох сервісів,
ECS RunningTaskCount (Container Insights), RDS CPU + DatabaseConnections. 📸

## 15. Навантажувальний тест

У CloudShell (ендпоінт `/api/health` без throttler-а — інші маршрути
обмежені 100 запитами / 15 хв з одного IP):

```bash
npx --yes autocannon -c 50 -d 300 http://<ALB_DNS>/api/health
```

Поки йде тест (5 хв) і ще ~5 хв після: дашборд (RequestCount ↑), ECS →
`car-calc-backend` → Tasks: **1 → 2–3**, вкладка Events («has started 1 tasks»),
CloudWatch → Alarms → `TargetTracking-…-AlarmHigh` в стані ALARM.
Через ~15 хв після тесту — scale-in назад до 1.

📸 вивід autocannon, графіки дашборду, Events/кількість тасків.

## 16. Витрати: Budgets і Cost Explorer

- **Budgets** → Create budget → Use a template → *Monthly cost budget*,
  `car-calc-budget`, $10, email. В акаунті доступ лише на читання — якщо
  AccessDenied, 📸 помилки + показати наявні бюджети, написати ментору.
- **Cost Explorer** → Cost and usage → Group by **Service**, фільтр за
  останні 7 днів / поточний місяць → 📸 (найдорожчі: RDS, ALB, Fargate, VPC public IPv4).

Оцінка вартості (us-east-1, on-demand, ≈ місяць 24/7): ALB ~$16 + LCU,
Fargate 0.5 vCPU/1 GB + 0.25/0.5 GB ~$27, RDS db.t4g.micro ~$12 + 20 GB ~$2.3,
public IPv4 ~$3.6 за адресу, CloudWatch/ECR/S3/Secrets — копійки.

## 17. Прибирання після оцінки

Порядок (зворотний): ECS services (desired 0 → delete) → cluster → ALB →
target groups → RDS (без final snapshot) → DB subnet group → Secret
(можна з recovery window 7 днів) → ECR repos → S3 (Empty → Delete) →
log groups → alarms, dashboard, SNS → VPC (Delete VPC видалить підмережі/SG).
Ролі `focc-` можна лишити.
