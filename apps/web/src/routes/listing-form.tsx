import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import type { Condition, CreateListingBody, ListingDetail, ListingKind, PriceType } from '@campusmarkt/contracts';
import { useMeta } from '../api/auth';
import { uploadImages, useCreateListing, useListing, useUpdateListing } from '../api/listings';
import { ApiError, errorMessage } from '../api/client';
import { Alert, Button, FormError, Field, Loading, PageHeader, Select, TextArea } from '../components/ui';
import { centsToEuroInput, conditionLabels, kindLabels, parseEuroToCents, priceTypeLabels } from '../lib/format';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

interface FormImage {
  key: string;
  id?: string;
  preview: string;
  state: 'uploading' | 'ready' | 'error';
  error?: string;
}

function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError)) return {};
  const out: Record<string, string> = {};
  for (const e of err.errors) {
    const key = e.path.replace(/^\//, '').split('/')[0] ?? '';
    if (key && !out[key]) out[key] = e.message;
  }
  return out;
}

export function ListingFormPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  if (!id) return <ListingForm />;
  return <EditLoader id={id} />;
}

function EditLoader({ id }: { id: string }) {
  const { data, isPending, isError, error } = useListing(id);
  if (isPending) return <Loading />;
  if (isError) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data.isOwner) return <Alert tone="error">Du kannst nur eigene Anzeigen bearbeiten.</Alert>;
  return <ListingForm initial={data} />;
}

function ListingForm({ initial }: { initial?: ListingDetail }) {
  const navigate = useNavigate();
  const { data: meta } = useMeta();
  const create = useCreateListing();
  const update = useUpdateListing(initial?.id ?? '');
  const mutation = initial ? update : create;
  const fileInput = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<ListingKind>(initial?.kind ?? 'offer');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [priceType, setPriceType] = useState<PriceType>(initial?.priceType ?? 'fixed');
  const [price, setPrice] = useState(centsToEuroInput(initial?.priceCents));
  const [condition, setCondition] = useState<Condition | ''>(initial?.condition ?? '');
  const [locationIds, setLocationIds] = useState<string[]>(initial?.locationIds ?? []);
  const [studyProgram, setStudyProgram] = useState(initial?.attributes.studyProgram ?? '');
  const [module, setModule] = useState(initial?.attributes.module ?? '');
  const [isbn, setIsbn] = useState(initial?.attributes.isbn ?? '');
  const [images, setImages] = useState<FormImage[]>(
    () =>
      initial?.images.map((img) => ({
        key: img.id,
        id: img.id,
        preview: img.status === 'ready' ? `${img.url}/sm` : '',
        state: 'ready' as const,
      })) ?? [],
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Object-URLs der lokalen Vorschauen wieder freigeben
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(
    () => () => imagesRef.current.forEach((i) => i.preview.startsWith('blob:') && URL.revokeObjectURL(i.preview)),
    [],
  );

  const maxImages = meta?.maxImagesPerListing ?? 8;
  const maxBytes = meta?.maxImageBytes ?? 10 * 1024 * 1024;
  const category = meta?.categories.find((c) => c.id === categoryId);
  const needsPrice = priceType === 'fixed' || priceType === 'negotiable';

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const free = maxImages - images.length;
    if (files.length > free) setFormError(`Maximal ${maxImages} Bilder pro Anzeige.`);
    const accepted: { file: File; img: FormImage }[] = [];
    const rejected: FormImage[] = [];
    for (const file of files.slice(0, Math.max(0, free))) {
      const img: FormImage = { key: crypto.randomUUID(), preview: URL.createObjectURL(file), state: 'uploading' };
      if (!ACCEPTED.includes(file.type)) rejected.push({ ...img, state: 'error', error: 'Nur JPEG, PNG oder WebP.' });
      else if (file.size > maxBytes) rejected.push({ ...img, state: 'error', error: 'Datei größer als 10 MB.' });
      else accepted.push({ file, img });
    }
    setImages((prev) => [...prev, ...accepted.map((a) => a.img), ...rejected]);
    if (!accepted.length) return;
    try {
      const res = await uploadImages(accepted.map((a) => a.file));
      setImages((prev) =>
        prev.map((p) => {
          const idx = accepted.findIndex((a) => a.img.key === p.key);
          const uploaded = idx >= 0 ? res.uploads[idx] : undefined;
          return uploaded ? { ...p, id: uploaded.id, state: 'ready' } : p;
        }),
      );
    } catch (err) {
      const msg = errorMessage(err, 'Upload fehlgeschlagen.');
      setImages((prev) => prev.map((p) => (accepted.some((a) => a.img.key === p.key) ? { ...p, state: 'error', error: msg } : p)));
    }
  };

  const removeImage = (key: string) =>
    setImages((prev) => {
      const img = prev.find((p) => p.key === key);
      if (img?.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview);
      return prev.filter((p) => p.key !== key);
    });

  const moveImage = (index: number, delta: number) =>
    setImages((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const toggleLocation = (locId: string) =>
    setLocationIds((prev) => (prev.includes(locId) ? prev.filter((l) => l !== locId) : [...prev, locId]));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};
    const priceCents = needsPrice ? parseEuroToCents(price) : null;
    if (title.trim().length < 3) errors.title = 'Mindestens 3 Zeichen.';
    if (description.trim().length < 10) errors.description = 'Mindestens 10 Zeichen.';
    if (!categoryId) errors.categoryId = 'Bitte wähle eine Kategorie.';
    if (needsPrice && (priceCents == null || priceCents < 1 || priceCents > 1_000_000))
      errors.priceCents = 'Bitte gib einen Preis zwischen 0,01 € und 10.000 € an.';
    if (!locationIds.length) errors.locationIds = 'Bitte wähle mindestens einen Übergabeort.';
    if (images.some((i) => i.state === 'uploading')) errors.images = 'Bitte warte, bis alle Bilder hochgeladen sind.';
    setClientErrors(errors);
    if (Object.keys(errors).length) {
      setFormError('Bitte prüfe die markierten Felder.');
      return;
    }

    const body: CreateListingBody = {
      kind,
      title: title.trim(),
      description: description.trim(),
      categoryId,
      priceType,
      priceCents,
      condition: condition || null,
      locationIds,
      attributes: category?.hasStudyAttributes
        ? {
            ...(studyProgram.trim() && { studyProgram: studyProgram.trim() }),
            ...(module.trim() && { module: module.trim() }),
            ...(isbn.trim() && { isbn: isbn.trim() }),
          }
        : {},
      imageIds: images.filter((i) => i.state === 'ready' && i.id).map((i) => i.id!),
    };
    mutation.mutate(body, {
      onSuccess: (listing) => void navigate({ to: '/listings/$id', params: { id: listing.id } }),
    });
  };

  const serverErrors = fieldErrors(mutation.error);
  const err = (key: string) => clientErrors[key] ?? serverErrors[key];
  const serverMessage = mutation.isError
    ? mutation.error instanceof ApiError && mutation.error.code === 'listing_limit'
      ? 'Du hast bereits die maximale Anzahl aktiver Anzeigen (30).'
      : errorMessage(mutation.error)
    : null;

  if (!meta) return <Loading />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={initial ? 'Anzeige bearbeiten' : 'Neue Anzeige'} />
      <form onSubmit={submit} noValidate className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-800">Art der Anzeige</legend>
          <div className="flex gap-4">
            {(['offer', 'wanted'] as const).map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="h-5 w-5 accent-brand-700" />
                {kindLabels[k]}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Titel" required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} error={err('title')} />
        <TextArea
          label="Beschreibung"
          required
          rows={6}
          maxLength={4000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={err('description')}
          hint={`${description.length}/4000 Zeichen`}
        />
        <Select
          label="Kategorie"
          required
          placeholder="Bitte wählen"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={meta.categories.map((c) => ({ value: c.id, label: c.name }))}
          error={err('categoryId')}
        />

        {category?.hasStudyAttributes && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Studiengang" maxLength={80} value={studyProgram} onChange={(e) => setStudyProgram(e.target.value)} error={err('attributes')} />
            <Field label="Modul" maxLength={80} value={module} onChange={(e) => setModule(e.target.value)} />
            <Field label="ISBN" maxLength={17} inputMode="numeric" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Preistyp"
            required
            value={priceType}
            onChange={(e) => setPriceType(e.target.value as PriceType)}
            options={(Object.keys(priceTypeLabels) as PriceType[]).map((p) => ({ value: p, label: priceTypeLabels[p] }))}
          />
          {needsPrice && (
            <Field label="Preis in €" required inputMode="decimal" placeholder="z. B. 12,50" value={price} onChange={(e) => setPrice(e.target.value)} error={err('priceCents')} />
          )}
        </div>

        <Select
          label="Zustand"
          placeholder="Keine Angabe"
          value={condition}
          onChange={(e) => setCondition(e.target.value as Condition | '')}
          options={(Object.keys(conditionLabels) as Condition[]).map((c) => ({ value: c, label: conditionLabels[c] }))}
        />

        <fieldset className="space-y-2" aria-describedby={err('locationIds') ? 'loc-err' : undefined}>
          <legend className="text-sm font-medium text-slate-800">
            Übergabeorte <span aria-hidden="true" className="text-red-700">*</span>
          </legend>
          {meta.locations.map((l) => (
            <label key={l.id} className="flex items-center gap-2">
              <input type="checkbox" checked={locationIds.includes(l.id)} onChange={() => toggleLocation(l.id)} className="h-5 w-5 accent-brand-700" />
              {l.name}
            </label>
          ))}
          {err('locationIds') && (
            <p id="loc-err" className="text-sm font-medium text-red-700">
              {err('locationIds')}
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-800">
            Bilder ({images.length}/{maxImages})
          </legend>
          <p className="text-sm text-slate-600">JPEG, PNG oder WebP, je höchstens 10 MB. Standortdaten (EXIF) werden automatisch entfernt.</p>
          {images.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img, i) => (
                <li key={img.key} className="space-y-1 rounded-lg border border-slate-200 p-1">
                  <div className="aspect-square overflow-hidden rounded bg-slate-100">
                    {img.preview && <img src={img.preview} alt={`Bild ${i + 1}`} className="h-full w-full object-cover" />}
                  </div>
                  <p className="text-xs" aria-live="polite">
                    {img.state === 'uploading' && 'Wird hochgeladen …'}
                    {img.state === 'error' && <span className="text-red-700">{img.error}</span>}
                    {img.state === 'ready' && i === 0 && 'Titelbild'}
                  </p>
                  <div className="flex justify-between gap-1">
                    <button type="button" className="rounded px-2 py-1 text-sm hover:bg-slate-100 disabled:opacity-40" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label={`Bild ${i + 1} nach vorne`}>
                      ←
                    </button>
                    <button type="button" className="rounded px-2 py-1 text-sm text-red-700 hover:bg-red-50" onClick={() => removeImage(img.key)} aria-label={`Bild ${i + 1} entfernen`}>
                      Entfernen
                    </button>
                    <button type="button" className="rounded px-2 py-1 text-sm hover:bg-slate-100 disabled:opacity-40" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} aria-label={`Bild ${i + 1} nach hinten`}>
                      →
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <input ref={fileInput} type="file" accept={ACCEPTED.join(',')} multiple className="sr-only" id="file-input" aria-label="Bilddateien auswählen" onChange={(e) => void onFiles(e)} tabIndex={-1} />
          <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={images.length >= maxImages}>
            Bilder hinzufügen
          </Button>
          {err('images') && <p className="text-sm font-medium text-red-700">{err('images')}</p>}
        </fieldset>

        <FormError error={formError ?? serverMessage} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => window.history.back()}>
            Abbrechen
          </Button>
          <Button type="submit" busy={mutation.isPending}>
            {initial ? 'Änderungen speichern' : 'Veröffentlichen'}
          </Button>
        </div>
        <p className="text-xs text-slate-600">Anzeigen mit bestimmten Begriffen werden vor der Veröffentlichung von der Moderation geprüft.</p>
      </form>
    </div>
  );
}
