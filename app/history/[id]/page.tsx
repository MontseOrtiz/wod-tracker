import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';
import type { Block } from '@/types/database';
import { formatRepScheme, totalReps } from '@/lib/rep-scheme';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatWeight(weight: number | null, unit: string | null): string {
  if (weight === null) return '';
  if (unit === '%') return `${weight}%`;
  if (unit) return `${weight} ${unit}`;
  return `${weight}`;
}

function formatExerciseLine(ex: Tables<'exercises'>): string {
  const parts: string[] = [];
  if (ex.rep_scheme) {
    parts.push(`${formatRepScheme(ex.rep_scheme)} (${totalReps(ex.rep_scheme)} reps)`);
  } else {
    if (ex.sets) parts.push(`${ex.sets} series`);
    if (ex.reps) parts.push(`${ex.reps} reps`);
  }
  const weightStr = formatWeight(ex.weight, ex.unit);
  if (weightStr) parts.push(weightStr);
  return parts.join(', ');
}

const BLOCK_ORDER: Block['block_type'][] = ['warmup', 'strength_skill', 'wod'];

const BLOCK_LABELS: Record<Block['block_type'], string> = {
  warmup: 'Calentamiento',
  strength_skill: 'Fuerza / Habilidad',
  wod: 'WOD',
};

// Each block type has its own shape, so they read apart at a glance without leaning on color.
const BLOCK_SHAPE: Record<Block['block_type'], string> = {
  warmup: 'rounded-full bg-pink',
  strength_skill: 'rounded-md bg-yellow',
  wod: 'bg-red [clip-path:polygon(50%_0,100%_100%,0_100%)]',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (sessionError || !session) notFound();

  // Fetch blocks for this session
  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('session_id', id);

  const blockList = blocks ?? [];

  // Fetch all exercises for those blocks in one query
  const blockIds = blockList.map(b => b.id);
  const { data: exercises } = blockIds.length > 0
    ? await supabase.from('exercises').select('*').in('block_id', blockIds)
    : { data: [] };

  const exerciseList = exercises ?? [];

  // Sort blocks into the logical display order
  const sortedBlocks = BLOCK_ORDER
    .map(type => blockList.find(b => b.block_type === type))
    .filter(Boolean) as Block[];

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex flex-col items-start gap-3">
        <Link href="/history" className="btn-ghost min-h-11 px-4 py-2 text-sm">← Tus rounds</Link>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight first-letter:uppercase">
          {formatDate(session.session_date)}
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        {sortedBlocks.map(block => {
          const blockExercises = exerciseList.filter(ex => ex.block_id === block.id);
          const isEmpty =
            blockExercises.length === 0 &&
            !block.notes &&
            !(block.block_type === 'wod' && (block.wod_format || block.result));

          return (
            <section key={block.id} className="overflow-hidden rounded-3xl border-2 border-blue bg-cream">
              <h2 className="flex items-center gap-3 bg-blue px-5 py-3 text-lg font-bold text-cream">
                <span aria-hidden="true" className={`size-4 shrink-0 border-2 border-ink ${BLOCK_SHAPE[block.block_type]}`} />
                {BLOCK_LABELS[block.block_type]}
              </h2>

              <div className="flex flex-col gap-3 p-5">
                {block.block_type === 'wod' && (block.wod_format || block.result) && (
                  <dl className="flex flex-col gap-1 text-base">
                    {block.wod_format && (
                      <div className="flex gap-2">
                        <dt className="font-bold">Formato:</dt>
                        <dd>{block.wod_format}</dd>
                      </div>
                    )}
                    {block.result && (
                      <div className="flex gap-2">
                        <dt className="font-bold">Resultado:</dt>
                        <dd>{block.result}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {block.block_type === 'warmup' && block.notes && (
                  <p className="whitespace-pre-wrap text-base">{block.notes}</p>
                )}

                {blockExercises.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {blockExercises.map(ex => {
                      const line = formatExerciseLine(ex);
                      return (
                        <li key={ex.id} className="flex flex-col gap-1 rounded-2xl border-2 border-ink bg-yellow px-4 py-3">
                          <span className="text-base font-bold">{ex.exercise_name}</span>
                          {line && <span className="text-sm font-medium">{line}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {isEmpty && <p className="text-base text-ink/80">Nada registrado en este bloque.</p>}
              </div>
            </section>
          );
        })}

        {session.whiteboard_photo_url && (
          <details className="rounded-3xl border-2 border-ink bg-cream p-5">
            <summary className="cursor-pointer text-lg font-bold">Foto del WOD</summary>
            {/* unoptimized: users may upload HEIC, which the Next image optimizer can't process */}
            <Image
              src={session.whiteboard_photo_url}
              alt={`Entrenamiento del ${formatDate(session.session_date)}`}
              width={1200}
              height={900}
              unoptimized
              className="mt-4 h-auto w-full rounded-2xl border-2 border-ink"
            />
          </details>
        )}
      </div>
    </main>
  );
}
