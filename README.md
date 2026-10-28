# AI-Bottleneck Analist
Dit is de client-side process mining aggregator voor Celonis CSV's. 
Gebouwd met Vanilla JS, Tailwind CSS en Chart.js om privacy-veilig en lokaal te werken.

## Supabase

De analysegeschiedenis wordt opgeslagen in de Supabase-tabel `analysis_history`.
De client gebruikt anonieme Supabase-authenticatie en elke rij is gekoppeld aan
de ingelogde gebruiker via `user_id`. Row-level security voorkomt dat gebruikers
elkaars analyses kunnen lezen, wijzigen of verwijderen.

Voer de migraties uit in `Portfolio-Website-Luc/supabase/migrations` voordat je
de app publiceert. Controleer in Supabase Auth ook dat **Anonymous sign-ins**
zijn ingeschakeld. De publishable key mag in de browsercode staan; gebruik nooit
een Supabase service-role key in deze app.

## Bottleneck-alerts

De voorspellingstabel dedupliceert alerts per `case_id:::knelpunt_stap` en
leest bestaande records uit de tabel `bottleneck_alerts`. De tabel moet minimaal
deze kolommen bevatten:

`case_id`, `knelpunt_stap`, `risico_percentage`, `huidige_duur_uren`,
`timestamp_alert`.

De frontend stuurt alerts naar `/api/send-alert`. Deze Vercel Serverless
Function leest de Make-URL server-side uit `MAKE_WEBHOOK_URL`, zodat de URL
niet in de browserbundel terechtkomt. Stel in Vercel bij **Project Settings >
Environment Variables** in:

```text
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/...
```

De webhook ontvangt uitsluitend de vijf geanonimiseerde procesvelden uit de
alertpayload. Als Make niet geconfigureerd of tijdelijk niet bereikbaar is,
wordt de alert nog steeds in Supabase opgeslagen en meldt de UI dit subtiel.
