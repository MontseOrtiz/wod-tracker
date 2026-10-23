'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateImage } from '@/lib/upload-validation';
import { todayLocal } from '@/lib/date';
import type { ParsedWorkout } from '@/lib/workout-schema';
import {
  buildSavePayload,
  getInitialData,
  hasValidWorkoutData,
  toExerciseRows,
  type WorkoutForm,
} from '@/lib/log-form';

export type Step = 0 | 1 | 2 | 3;

export function useWorkoutLog() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [formData, setFormData] = useState<WorkoutForm>(getInitialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsingPhoto, setIsParsingPhoto] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  function updateField<K extends keyof WorkoutForm>(key: K, value: WorkoutForm[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function handleAnalyzePhoto() {
    if (!selectedFile) {
      setParseError('Selecciona una foto primero.');
      return;
    }

    // Fail fast with the same rules the server enforces.
    const validation = validateImage(selectedFile);
    if (!validation.ok) {
      setParseError(validation.error);
      return;
    }

    setIsParsingPhoto(true);
    setParseError(null);

    try {
      const body = new FormData();
      body.append('image', selectedFile);

      const res = await fetch('/api/parse-workout', { method: 'POST', body });
      const json = await res.json();

      if (!res.ok) {
        setParseError(json.error ?? 'No se pudo leer la foto.');
        setIsParsingPhoto(false);
        return;
      }

      const { data } = json as { data: ParsedWorkout };

      setFormData(prev => ({
        ...prev,
        warmupNotes: data.warmup_notes,
        strengthExercises: toExerciseRows(data.strength_skill),
        wodFormat: data.wod.wod_format,
        wodExercises: toExerciseRows(data.wod.exercises),
      }));
      setStep(1);
    } catch {
      setParseError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setIsParsingPhoto(false);
    }
  }

  async function handleSave() {
    if (!hasValidWorkoutData(formData)) {
      setError('Registra al menos un dato del entrenamiento antes de guardar.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const body = new FormData();
    body.append('payload', JSON.stringify(buildSavePayload(formData, todayLocal())));
    if (selectedFile) body.append('photo', selectedFile);

    try {
      const res = await fetch('/api/sessions', { method: 'POST', body });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? 'No se pudo guardar el entrenamiento.');
        setIsSaving(false);
        return;
      }
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
      setIsSaving(false);
      return;
    }

    router.push('/log/success');
  }

  return {
    step,
    setStep,
    formData,
    updateField,
    selectedFile,
    setSelectedFile,
    isParsingPhoto,
    parseError,
    isSaving,
    error,
    handleAnalyzePhoto,
    handleSave,
  };
}
