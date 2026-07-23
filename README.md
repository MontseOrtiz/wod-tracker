# WOD Tracker 🏋️

App personal para registrar mis entrenamientos de CrossFit. El WOD del día normalmente aparece en un pizarrón físico o en la historia de Instagram del box, y yo terminaba copiándolo a mano a mis notas del teléfono — cero registro real de mi progreso, mucha fricción para algo que debería ser simple.

Así que construí esto: le tomo una foto al pizarrón, y una IA con visión (Gemini) lo interpreta y me arma el registro sola — yo solo confirmo o ajusto antes de guardar.

**[Ver demo en vivo →](https://wod-tracker-iota.vercel.app/)**

## Cómo funciona

1. Subes una foto del pizarrón (o la omites y lo llenas manual, para los días en que el calentamiento real no fue el que estaba escrito)
2. La foto se sube a Supabase Storage y se la mando a la API de Gemini con un prompt que le pide devolverme el entrenamiento como JSON estructurado
3. Con eso se pre-llena un wizard de 3 pasos (Calentamiento → Fuerza/Habilidad → WOD), donde reviso y edito antes de guardar — la letra de los coaches no siempre es fácil ni para un humano, así que siempre reviso
4. Al guardar, todo se registra en Postgres (vía Supabase): sesión, bloques, y cada ejercicio con su peso/unidad (kg, lb o %, porque a veces te piden trabajar a cierto porcentaje de tu marca)
5. Desde el historial puedo ver entrenos pasados, filtrar por mes/año, y revisar el detalle completo de cualquier sesión

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Postgres + Storage) — sin autenticación, porque es solo para mí
- **Gemini API** (Google) — para que la IA lea la foto del pizarrón
- Desplegado en **Vercel**

## Algunas decisiones que tomé a propósito

- **Nada de autenticación.** Es una app de un solo usuario — yo. No tenía caso complicarla con login para un problema que no existe todavía.
- **Reintentos automáticos con las llamadas a Gemini.** Cuando el modelo está saturado (pasa más seguido de lo que pensarías), la app reintenta sola un par de veces antes de rendirse y avisarme.
- **Validaciones antes de guardar.** No me deja guardar un entrenamiento vacío, ni guarda ejercicios sin nombre — ni siquiera si vinieron pre-llenados por la IA y los borré sin querer.
- **RLS de Supabase configurado a mano**, en vez de dejarlo en default. Para este proyecto personal decidí mantenerlo simple (sin autenticación real), así que documenté esa decisión en vez de ignorarla.

## Si quieres correrlo tú

```bash
git clone https://github.com/MontseOrtiz/wod-tracker.git
cd wod-tracker
npm install
```

Crea un `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=tu-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
GEMINI_API_KEY=tu-api-key
```

```bash
npm run dev
```

## Lo que sigue

- Que la app me sugiera el peso que usé la última vez en cada ejercicio (útil para saber si vas progresando)
- Autocomplete de ejercicios, basado en mi propio historial
- Gráficas de progreso de peso por ejercicio