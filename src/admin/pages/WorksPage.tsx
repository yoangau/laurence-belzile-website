/** Œuvres / Expositions: the feed in order, with search, filters, "Marquer vendue" and reordering. */
import {
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconEyeOff, IconPlus, IconSearch } from '@tabler/icons-react';
import { useMemo, useState, type ReactNode } from 'react';
import { formatDimensions, formatPrice, imageUrl, pick, titlePlain } from '../../content/format';
import type { Work } from '../../content/schema';
import { MoveButtons, SortableList } from '../components/Sortable';
import { linkProps, navigate } from '../router';
import { edit, save, useContent, useHasErrors, useMediaUrl } from '../state';
import {
  AVAILABILITY_COLORS,
  AVAILABILITY_LABELS,
  KIND,
  moveWork,
  newWork,
  nextWorkId,
  updateArtwork,
  type Kind,
} from '../works';

const ALL = 'all';

export function WorksPage({ kind }: { kind: Kind }) {
  const content = useContent();
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<string>(ALL);
  const [availability, setAvailability] = useState<string>(ALL);
  const [creating, setCreating] = useState(false);

  const all = useMemo(() => content.works.filter((w) => w.kind === kind), [content.works, kind]);
  const years = useMemo(() => [...new Set(all.map((w) => w.year))].sort((a, b) => b - a), [all]);
  const query = search.trim().toLowerCase();
  const visible = all.filter(
    (w) =>
      (!query || w.id.toLowerCase().includes(query) || `${w.title.fr} ${w.title.en}`.toLowerCase().includes(query)) &&
      (year === ALL || String(w.year) === year) &&
      (availability === ALL ||
        (availability === 'hidden' ? w.hidden : w.kind === 'artwork' && w.availability === availability)),
  );
  const filtered = visible.length !== all.length;

  const onMove = (from: number, to: number) => {
    const target = visible[to];
    const work = visible[from];
    if (work && target) moveWork(work.id, target.id, to < from ? 'up' : 'down');
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={1}>{KIND[kind].plural}</Title>
          <Text c="dimmed" size="sm">
            {filtered ? `${visible.length} sur ${all.length}` : `${all.length} au total`} · dans l’ordre du site, la plus
            récente en haut
          </Text>
        </div>
        <Button leftSection={<IconPlus size={18} />} onClick={() => setCreating(true)}>
          {KIND[kind].new}
        </Button>
      </Group>

      <Group gap="sm" align="flex-end" wrap="wrap">
        <TextInput
          label="Rechercher"
          placeholder="Titre ou numéro (LB…)"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: '1 1 220px' }}
        />
        <Select
          label="Année"
          data={[{ value: ALL, label: 'Toutes' }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
          value={year}
          onChange={(v) => setYear(v ?? ALL)}
          allowDeselect={false}
          w={130}
        />
        <Select
          label={kind === 'artwork' ? 'Disponibilité' : 'Visibilité'}
          data={[
            { value: ALL, label: 'Toutes' },
            ...(kind === 'artwork'
              ? Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({ value, label }))
              : []),
            { value: 'hidden', label: 'Masquées du site' },
          ]}
          value={availability}
          onChange={(v) => setAvailability(v ?? ALL)}
          allowDeselect={false}
          w={180}
        />
      </Group>
      {filtered && (
        <Text size="xs" c="dimmed">
          Liste filtrée : un déplacement place l’élément juste avant ou après son voisin visible.
        </Text>
      )}

      {visible.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Aucun résultat.
        </Text>
      ) : (
        <SortableList items={visible} getId={(w) => w.id} onMove={onMove} container={(rows) => <Box>{rows}</Box>}>
          {(work, index, handle) => (
            <WorkRow
              work={work}
              index={content.works.indexOf(work)}
              position={index}
              count={visible.length}
              onMove={onMove}
              handle={handle}
            />
          )}
        </SortableList>
      )}

      <NewWorkModal kind={kind} opened={creating} onClose={() => setCreating(false)} />
    </Stack>
  );
}

const markSold = async (work: Work) => {
  const title = titlePlain(work, 'fr');
  updateArtwork(work.id, (a) => {
    a.availability = 'sold';
  });
  const undo = () => {
    updateArtwork(work.id, (a) => {
      a.availability = 'available';
    });
    void save({ quiet: true }).then((ok) => ok && notifications.show({ message: `« ${title} » est de nouveau disponible.` }));
  };
  if (!(await save({ quiet: true }))) return;
  notifications.show({
    color: 'dark',
    icon: <IconCheck size={18} />,
    title: `« ${title} » est vendue`,
    message: (
      <Group justify="space-between" gap="xs">
        <Text size="sm">Enregistré. Pensez à publier.</Text>
        <Button size="compact-sm" variant="default" onClick={undo}>
          Annuler
        </Button>
      </Group>
    ),
    autoClose: 8000,
  });
};

type RowProps = {
  work: Work;
  /** Index in content.works (for validation paths). */
  index: number;
  /** Index in the visible list. */
  position: number;
  count: number;
  onMove: (from: number, to: number) => void;
  handle: ReactNode;
};

function WorkRow({ work, index, position, count, onMove, handle }: RowProps) {
  const mediaUrl = useMediaUrl();
  const hasErrors = useHasErrors(`works.${index}.`);
  const image = work.images[0];
  const path = `${KIND[work.kind].path}/${work.id}`;
  const title = titlePlain(work, 'fr');
  const details =
    work.kind === 'artwork'
      ? [pick(work.medium, 'fr'), formatDimensions(work.dimensions), work.price ? formatPrice(work.price, 'fr') : '']
      : [work.venue ?? ''];

  return (
    <Paper withBorder p="xs" mb={6} radius="sm" className="lb-row">
      <Group gap="sm" wrap="nowrap" align="center">
        {handle}
        <UnstyledButton {...linkProps(path)} component="a" className="lb-row-link" aria-label={`Modifier ${title}`}>
          <Box className="lb-thumb" style={{ backgroundColor: image?.color ?? '#eee' }}>
            {image && <img src={imageUrl(mediaUrl, image, Math.min(...image.widths))} alt="" loading="lazy" />}
          </Box>
          <Box style={{ minWidth: 0 }}>
            <Text fw={500} fs={work.title.fr ? 'italic' : undefined} truncate>
              {title}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {work.id} · {work.year}
              {details.filter(Boolean).map((d) => ` · ${d}`)}
            </Text>
          </Box>
        </UnstyledButton>
        <Group gap={6} wrap="nowrap" className="lb-row-badges">
          {hasErrors && (
            <Badge color="red" variant="light" leftSection={<IconAlertTriangle size={12} />}>
              À corriger
            </Badge>
          )}
          {work.hidden && (
            <Badge color="gray" variant="outline" leftSection={<IconEyeOff size={12} />}>
              Masquée
            </Badge>
          )}
          {work.kind === 'artwork' && (
            <Badge color={AVAILABILITY_COLORS[work.availability]} variant="light">
              {AVAILABILITY_LABELS[work.availability]}
            </Badge>
          )}
        </Group>
        {work.kind === 'artwork' && work.availability === 'available' ? (
          <Button size="compact-sm" variant="default" onClick={() => void markSold(work)} className="lb-sold-button">
            Marquer vendue
          </Button>
        ) : (
          <Box className="lb-sold-button" aria-hidden />
        )}
        <MoveButtons index={position} count={count} onMove={onMove} />
      </Group>
    </Paper>
  );
}

function NewWorkModal({ kind, opened, onClose }: { kind: Kind; opened: boolean; onClose: () => void }) {
  const content = useContent();
  const [id, setId] = useState('');
  const suggested = useMemo(() => nextWorkId(content), [content]);
  const value = id || suggested;
  const error = !/^[A-Za-z0-9._-]+$/.test(value)
    ? 'Lettres, chiffres, point et tiret seulement'
    : content.works.some((w) => w.id === value)
      ? 'Ce numéro est déjà utilisé'
      : undefined;

  const create = () => {
    if (error) return;
    edit((draft) => {
      draft.works.unshift(newWork(kind, value));
    });
    setId('');
    onClose();
    navigate(`${KIND[kind].path}/${value}`);
  };

  return (
    <Modal opened={opened} onClose={onClose} title={KIND[kind].new}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <Stack>
          <TextInput
            label="Numéro"
            description="Il apparaît dans l’adresse de la page et dans le courriel d’achat. Il ne pourra plus être changé."
            value={value}
            onChange={(e) => setId(e.currentTarget.value.trim())}
            error={error}
            data-autofocus
          />
          <Text size="sm" c="dimmed">
            L’{KIND[kind].one} sera ajoutée en haut de la liste. Ajoutez au moins une image avant d’enregistrer.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!!error}>
              Créer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

