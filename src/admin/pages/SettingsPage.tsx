/** Réglages: contact, social links, photographers, price table and portrait. */
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconSortAscending, IconTrash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { formatDimensions, formatPrice, imageUrl, suggestPrice, titlePlain } from '../../content/format';
import type { Artwork, Content, Settings } from '../../content/schema';
import { NumberField, slugify } from '../components/fields';
import { ImageUploader } from '../components/ImageUploader';
import { NO_CREDIT, useCreditOptions } from '../components/ImagesField';
import { edit, useContent, useFieldError, useMediaUrl } from '../state';
import { Section } from './WorkEditor';

const updateSettings = (recipe: (settings: Settings) => void) =>
  edit((draft) => {
    recipe(draft.settings);
  });

/** Sets an optional text setting, removing it when empty. */
const setOptional = (key: 'instagramUrl' | 'facebookUrl' | 'analyticsId', value: string) =>
  updateSettings((s) => {
    if (value.trim()) s[key] = value.trim();
    else delete s[key];
  });

export function SettingsPage() {
  const { settings } = useContent();
  const emailError = useFieldError('settings.email');
  const instagramError = useFieldError('settings.instagramUrl');
  const facebookError = useFieldError('settings.facebookUrl');
  return (
    <Stack gap="md" maw={980}>
      <Title order={1}>Réglages</Title>
      <Section title="Contact et réseaux">
        <TextInput
          label="Courriel"
          description="Reçoit les demandes d’achat (« disponible ») et s’affiche sur la page contact."
          value={settings.email}
          error={emailError}
          onChange={(e) => {
            const email = e.currentTarget.value.trim();
            updateSettings((s) => {
              s.email = email;
            });
          }}
        />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Instagram"
            placeholder="https://www.instagram.com/…"
            value={settings.instagramUrl ?? ''}
            error={instagramError}
            onChange={(e) => setOptional('instagramUrl', e.currentTarget.value)}
          />
          <TextInput
            label="Facebook"
            placeholder="https://www.facebook.com/…"
            value={settings.facebookUrl ?? ''}
            error={facebookError}
            onChange={(e) => setOptional('facebookUrl', e.currentTarget.value)}
          />
        </SimpleGrid>
        <TextInput
          label="Statistiques de visites (Google Analytics)"
          description="Identifiant qui commence par G-. Vide = pas de statistiques."
          placeholder="G-XXXXXXXXXX"
          value={settings.analyticsId ?? ''}
          onChange={(e) => setOptional('analyticsId', e.currentTarget.value)}
          maw={320}
        />
      </Section>
      <Photographers />
      <PriceTable />
      <Portrait />
    </Stack>
  );
}

const creditUsage = (content: Content) => {
  const counts = new Map<string, number>();
  const images = [...content.works.flatMap((w) => w.images), ...(content.settings.portrait ? [content.settings.portrait] : [])];
  for (const image of images) if (image.credit) counts.set(image.credit, (counts.get(image.credit) ?? 0) + 1);
  return counts;
};

function Photographers() {
  const content = useContent();
  const { photographers } = content.settings;
  const usage = useMemo(() => creditUsage(content), [content]);
  const [name, setName] = useState('');
  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    let id = slugify(trimmed);
    for (let n = 2; photographers.some((p) => p.id === id); n++) id = `${slugify(trimmed)}-${n}`;
    updateSettings((s) => {
      s.photographers.push({ id, name: trimmed });
    });
    setName('');
  };
  return (
    <Section
      title="Photographes"
      description="Pour les crédits photo des images. Le premier de la liste est proposé par défaut pour les nouvelles images."
    >
      {photographers.map((p, index) => (
        <PhotographerRow key={p.id} name={p.name} index={index} used={usage.get(p.id) ?? 0} />
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Group gap="xs">
          <TextInput
            aria-label="Nouveau photographe"
            placeholder="Nom du nouveau photographe"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button type="submit" variant="default" leftSection={<IconPlus size={16} />} disabled={!name.trim()}>
            Ajouter
          </Button>
        </Group>
      </form>
    </Section>
  );
}

function PhotographerRow({ name, index, used }: { name: string; index: number; used: number }) {
  const error = useFieldError(`settings.photographers.${index}.name`);
  return (
    <Group gap="xs" wrap="nowrap">
      <TextInput
        aria-label={`Nom du photographe ${index + 1}`}
        value={name}
        onChange={(e) => {
          const value = e.currentTarget.value;
          updateSettings((s) => {
            s.photographers[index]!.name = value;
          });
        }}
        error={error}
        style={{ flex: 1 }}
      />
      <Text size="xs" c="dimmed" w={90}>
        {used} image{used > 1 ? 's' : ''}
      </Text>
      <Tooltip label={used ? 'Utilisé par des images : impossible de le supprimer' : 'Supprimer'}>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label={`Supprimer ${name}`}
          disabled={used > 0}
          onClick={() =>
            updateSettings((s) => {
              s.photographers.splice(index, 1);
            })
          }
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

type PriceChange = { work: Artwork; from: number | undefined; to: number };

const priceChanges = (content: Content): PriceChange[] =>
  content.works.flatMap((work) => {
    if (work.kind !== 'artwork' || work.availability !== 'available') return [];
    const to = suggestPrice(work.dimensions, content.settings.priceTable);
    return to !== undefined && to !== work.price ? [{ work, from: work.price, to }] : [];
  });

function PriceTable() {
  const content = useContent();
  const { priceTable } = content.settings;
  const [preview, setPreview] = useState<PriceChange[] | null>(null);

  const setRow = (index: number, field: 0 | 1 | 'price', value: number | undefined) =>
    updateSettings((s) => {
      const row = s.priceTable[index];
      if (!row) return;
      // Keep 0 while the field is empty: the check before saving points at it.
      if (field === 'price') row.price = value ?? 0;
      else row.dimensions[field] = value ?? 0;
    });

  const apply = () => {
    if (!preview) return;
    const prices = new Map(preview.map((c) => [c.work.id, c.to]));
    edit((draft) => {
      for (const work of draft.works) {
        const price = prices.get(work.id);
        if (work.kind === 'artwork' && price !== undefined) work.price = price;
      }
    });
    notifications.show({ color: 'dark', message: `${prices.size} prix mis à jour. Enregistrez pour confirmer.` });
    setPreview(null);
  };

  return (
    <Section
      title="Grille de prix"
      description="Sert à suggérer le prix d’une œuvre selon ses dimensions (dans un sens ou dans l’autre)."
    >
      <Table.ScrollContainer minWidth={420}>
        <Table striped verticalSpacing={4}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Largeur (po)</Table.Th>
              <Table.Th>Hauteur (po)</Table.Th>
              <Table.Th>Prix ($)</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {priceTable.map((row, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <NumberField
                    aria-label={`Largeur, ligne ${index + 1}`}
                    value={row.dimensions[0] || undefined}
                    onChange={(v) => setRow(index, 0, v)}
                    min={0}
                    step={0.25}
                    decimalScale={2}
                    size="xs"
                    w={90}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberField
                    aria-label={`Hauteur, ligne ${index + 1}`}
                    value={row.dimensions[1] || undefined}
                    onChange={(v) => setRow(index, 1, v)}
                    min={0}
                    step={0.25}
                    decimalScale={2}
                    size="xs"
                    w={90}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberField
                    aria-label={`Prix, ligne ${index + 1}`}
                    value={row.price || undefined}
                    onChange={(v) => setRow(index, 'price', v === undefined ? undefined : Math.round(v))}
                    min={0}
                    allowDecimal={false}
                    size="xs"
                    w={100}
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={`Supprimer la ligne ${index + 1}`}
                    onClick={() =>
                      updateSettings((s) => {
                        s.priceTable.splice(index, 1);
                      })
                    }
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Group gap="xs" wrap="wrap">
        <Button
          variant="default"
          leftSection={<IconPlus size={16} />}
          onClick={() =>
            updateSettings((s) => {
              s.priceTable.push({ dimensions: [0, 0], price: 0 });
            })
          }
        >
          Ajouter une ligne
        </Button>
        <Button
          variant="default"
          leftSection={<IconSortAscending size={16} />}
          onClick={() =>
            updateSettings((s) => {
              s.priceTable.sort(
                (a, b) => a.dimensions[0] * a.dimensions[1] - b.dimensions[0] * b.dimensions[1] || a.dimensions[0] - b.dimensions[0],
              );
            })
          }
        >
          Trier par taille
        </Button>
        <Button onClick={() => setPreview(priceChanges(content))}>Appliquer la grille aux œuvres disponibles</Button>
      </Group>

      <Modal opened={preview !== null} onClose={() => setPreview(null)} title="Appliquer la grille de prix" size="lg">
        {preview?.length === 0 ? (
          <Text>Toutes les œuvres disponibles ont déjà le prix de la grille. Rien à changer.</Text>
        ) : (
          <Stack>
            <Text size="sm">
              {preview?.length} œuvre(s) disponible(s) vont changer de prix. Les œuvres dont les dimensions ne sont pas
              dans la grille ne sont pas touchées.
            </Text>
            <Table.ScrollContainer minWidth={420} mah={400}>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Numéro</Table.Th>
                    <Table.Th>Titre</Table.Th>
                    <Table.Th>Dimensions</Table.Th>
                    <Table.Th>Prix</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {preview?.map(({ work, from, to }) => (
                    <Table.Tr key={work.id}>
                      <Table.Td>{work.id}</Table.Td>
                      <Table.Td fs="italic">{titlePlain(work, 'fr')}</Table.Td>
                      <Table.Td>{formatDimensions(work.dimensions)}</Table.Td>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                        {from === undefined ? '—' : formatPrice(from, 'fr')} → <b>{formatPrice(to, 'fr')}</b>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setPreview(null)}>
            {preview?.length ? 'Annuler' : 'Fermer'}
          </Button>
          {!!preview?.length && <Button onClick={apply}>Appliquer ces prix</Button>}
        </Group>
      </Modal>
    </Section>
  );
}

function Portrait() {
  const { settings } = useContent();
  const mediaUrl = useMediaUrl();
  const credits = useCreditOptions();
  const portrait = settings.portrait;
  return (
    <Section title="Portrait" description="La photo de la page « info ».">
      <Group align="flex-start" gap="md" wrap="wrap">
        {portrait && (
          <Box w={200}>
            <img
              src={imageUrl(mediaUrl, portrait, Math.min(...portrait.widths))}
              alt="Portrait actuel"
              style={{ width: '100%', display: 'block', backgroundColor: portrait.color }}
            />
            <Select
              mt={6}
              size="xs"
              aria-label="Crédit photo du portrait"
              data={credits}
              value={portrait.credit ?? NO_CREDIT}
              onChange={(v) =>
                updateSettings((s) => {
                  if (!s.portrait) return;
                  if (v) s.portrait.credit = v;
                  else delete s.portrait.credit;
                })
              }
              allowDeselect={false}
            />
          </Box>
        )}
        <Box style={{ flex: '1 1 260px' }}>
          <ImageUploader
            prefix="portrait"
            multiple={false}
            credit={portrait?.credit}
            label={portrait ? 'Glissez une nouvelle photo pour remplacer le portrait' : 'Glissez le portrait ici'}
            onUploaded={(image) =>
              updateSettings((s) => {
                s.portrait = image;
              })
            }
          />
        </Box>
      </Group>
    </Section>
  );
}
