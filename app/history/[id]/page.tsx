import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Block, Exercise } from '@/types/database';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatWeight(weight: number | null, unit: 'kg' | 'lb' | '%' | null): string {
  if (weight === null) return '';
  if (unit === '%') return `${weight}%`;
  if (unit) return `${weight} ${unit}`;
  return `${weight}`;
}

function formatExerciseLine(ex: Exercise): string {
  const parts: string[] = [];
  if (ex.sets) parts.push(`${ex.sets} sets`);
  if (ex.reps) parts.push(`${ex.reps} reps`);
  const weightStr = formatWeight(ex.weight, ex.unit);
  if (weightStr) parts.push(`@ ${weightStr}`);
  return parts.join(' · ');
}

const BLOCK_ORDER: Block['block_type'][] = ['warmup', 'strength_skill', 'wod'];

const BLOCK_LABELS: Record<Block['block_type'], string> = {
  warmup: 'Warmup',
  strength_skill: 'Strength / Skill',
  wod: 'WOD',
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
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">{formatDate(session.session_date)}</h1>
        <Link href="/history" className="text-sm text-gray-500 hover:text-gray-800">
          ← History
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {sortedBlocks.map(block => {
          const blockExercises = exerciseList.filter(ex => ex.block_id === block.id);

          return (
            <section key={block.id} className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {BLOCK_LABELS[block.block_type]}
              </h2>

              {/* WOD metadata */}
              {block.block_type === 'wod' && (block.wod_format || block.result) && (
                <div className="flex flex-col gap-1">
                  {block.wod_format && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Format:</span> {block.wod_format}
                    </p>
                  )}
                  {block.result && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Result:</span> {block.result}
                    </p>
                  )}
                </div>
              )}

              {/* Warmup notes */}
              {block.block_type === 'warmup' && block.notes && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{block.notes}</p>
              )}

              {/* Exercises */}
              {blockExercises.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {blockExercises.map(ex => (
                    <li
                      key={ex.id}
                      className="flex flex-col border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm font-medium">{ex.exercise_name}</span>
                      {formatExerciseLine(ex) && (
                        <span className="text-xs text-gray-500 mt-0.5">
                          {formatExerciseLine(ex)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty state for a block */}
              {block.block_type !== 'warmup' && blockExercises.length === 0 && !block.wod_format && !block.result && (
                <p className="text-sm text-gray-400 italic">Nothing logged.</p>
              )}
              {block.block_type === 'warmup' && !block.notes && blockExercises.length === 0 && (
                <p className="text-sm text-gray-400 italic">Nothing logged.</p>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
