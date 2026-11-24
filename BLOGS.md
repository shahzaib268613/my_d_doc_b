# Blogs module

PostgreSQL + Drizzle + Zod validation.

## Folder map

```
src/
  db/schema.ts                 blogs table
  blogs/
    blogs.module.ts
    controllers/
      blogs-admin.controller.ts   /admin/blogs
      blogs-public.controller.ts  /blogs
    services/
      blogs.service.ts
      blogs-scheduler.service.ts  cron every minute
    repositories/blogs.repository.ts
    schemas/blog.schemas.ts       Zod
    enums/blog-status.enum.ts
```

## Endpoints

### Public (`/blogs`)
- `GET /blogs` — published list (no `content`), query: page, limit, category
- `GET /blogs/by-slug/:slug` — published detail (does **not** increment views)
- `POST /blogs/by-slug/:slug/view` — increment views once per client call

### Admin (`/admin/blogs`, placeholder AdminGuard)
- `GET /admin/blogs/counts`
- `GET /admin/blogs` — status, search, page, limit
- `GET /admin/blogs/:id`
- `POST /admin/blogs`
- `PATCH /admin/blogs/:id`
- `POST /admin/blogs/:id/publish`
- `POST /admin/blogs/:id/unpublish`
- `DELETE /admin/blogs/:id`

## Database

```bash
cp .env.example .env
# set DATABASE_URL

npm run db:generate
npm run db:migrate
# or for local throwaway: npm run db:push
```
