---
product: Heroku
category: paas
---

# Heroku alternatives

## Open source
- Coolify
- Dokploy

## Commercial
- Vercel
- Netlify

## Best fit
- Avoiding a monthly bill just to keep an app running — Heroku removed its free dyno, Postgres, and Key-Value Store plans in November 2022, so even a minimal app now costs at least a few dollars a month (usage-based Eco dynos, $5/month Mini Postgres, $3/month Mini Key-Value Store); Coolify and Dokploy cost only whatever server you already run them on
- Keeping Heroku's own "push to Git, get a build and a running service" workflow without paying Heroku for it — both still build on the buildpack-driven deploy model Heroku popularized (Dokploy deploys via Heroku-style buildpacks directly; Coolify offers the same Git-push experience)
- Self-managed backing services instead of Heroku's paid add-ons — Dokploy provisions and backs up MySQL, PostgreSQL, MongoDB, MariaDB, and Redis itself, on the same servers as your app
