/** Editor for one artwork or exhibition. Every change goes to the draft; "Enregistrer" saves it. */
import {
  Anchor,
  Autocomplete,
  Badge,
  Box,
  Button,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconExternalLink, IconTrash } from '@tabler/icons-react';
import { useMemo, useState, type ReactNode } from 'react';
import { formatDimensions, formatPrice, imageUrl, suggestPrice, titlePlain } from '../../content/format';
import type { Artwork, Exhibition, Work } from '../../content/schema';
import { ImagesField } from '../components/ImagesField';
import { L10nInput, MarkdownField, NumberField, SyntaxHelp } from '../components/fields';
import { Link, linkProps, navigate } from '../router';
import { edit, useContent, useFieldError, useMediaUrl } from '../state';
import {
  AVAILABILITY_LABELS,
  distinctValues,
  KIND,
  updateArtwork,
  updateWork,
  type Availability,
  type Kind,
} from '../works';

export function Section({ title, children, description }: { title: string; children: ReactNode; description?: ReactNode }) {
  return (
    <Paper withBorder p={{ base: 'sm', sm: 'lg' }} radius="sm">
      <Title order={2} size="h4" mb={description ? 2 : 'sm'}>
        {title}
      </Title>
      {description && (
        <Text size="sm" c="dimmed" mb="sm" component="div">
          {description}
        </Text>
      )}
      <Stack gap="md">{children}</Stack>
    </Paper>
  );
}

export function WorkEditor({ kind, id }: { kind: Kind; id: string }) {
  const content = useContent();
  const index = content.works.findIndex((w) => w.id === id);
  const work = content.works[index];
  const back = KIND[kind].path;

  if (!work || work.kind !== kind) {
    return (
      <Stack align="flex-start">
        <Title order={1}>Introuvable</Title>
        <Text>Aucune {KIND[kind].one} ne porte le numéro {id}.</Text>
        <Button {...linkProps(back)} component="a" variant="default">
          Retour à la liste
        </Button>
      </Stack>
    );
  }

  const path = `works.${index}`;
  const remove = () =>
    modals.openConfirmModal({
      title: `Supprimer « ${titlePlain(work, 'fr')} » ?`,
      children: (
        <Text size="sm">
          L’{KIND[kind].one} sera retirée du site à la prochaine publication. Si vous voulez seulement la cacher,
          utilisez plutôt « Masquer du site ».
        </Text>
      ),
      labels: { confirm: 'Supprimer', cancel: 'Annuler' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        edit((draft) => {
          draft.works.splice(index, 1);
        });
        navigate(back);
        notifications.show({
          color: 'dark',
          title: 'Supprimée',
          message: (
            <Group justify="space-between" gap="xs">
              <Text size="sm">N’oubliez pas d’enregistrer.</Text>
              <Button
                size="compact-sm"
                variant="default"
                onClick={() =>
                  edit((draft) => {
                    draft.works.splice(index, 0, work);
                  })
                }
              >
                Annuler
              </Button>
            </Group>
          ),
        });
      },
    });

  return (
    <Stack gap="md" maw={980}>
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Box>
          <Anchor component={Link} to={back} size="sm" c="dimmed">
            <Group gap={4}>
              <IconArrowLeft size={14} /> {KIND[kind].plural}
            </Group>
          </Anchor>
          <Title order={1} fs={work.title.fr ? 'italic' : undefined}>
            {titlePlain(work, 'fr')}
          </Title>
          <Group gap="xs" mt={4}>
            <Badge variant="outline" color="gray" title="Le numéro ne peut pas être modifié">
              {work.id}
            </Badge>
            {work.hidden && <Badge color="gray">Masquée du site</Badge>}
          </Group>
        </Box>
        <Button
          component="a"
          href={`/projet/${work.id}`}
          target="_blank"
          rel="noopener"
          variant="subtle"
          color="gray"
          rightSection={<IconExternalLink size={14} />}
        >
          Voir la version en ligne
        </Button>
      </Group>

      <Section title="Images">
        <ImagesField workId={work.id} images={work.images} path={`${path}.images`} />
      </Section>

      <Section title="Informations">
        <L10nInput
          label="Titre"
          value={work.title}
          path={`${path}.title`}
          onChange={(title) =>
            updateWork(work.id, (w) => {
              w.title = title;
            })
          }
          description={
            <>
              Le titre est mis en italique automatiquement : inutile d’ajouter des astérisques. Laissé vide, il
              s’affiche « sans titre ». Si l’anglais est vide, le titre français est utilisé.
            </>
          }
        />
        <YearField work={work} path={path} />
        {work.kind === 'artwork' ? <ArtworkFields work={work} path={path} /> : <ExhibitionFields work={work} path={path} />}
      </Section>

      <Section title="Description" description={<SyntaxHelp long />}>
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          {(['fr', 'en'] as const).map((locale) => (
            <MarkdownField
              key={locale}
              label={locale === 'fr' ? 'Français' : 'Anglais'}
              value={work.description?.[locale] ?? ''}
              placeholder={locale === 'en' ? 'Vide = même texte qu’en français' : undefined}
              error={undefined}
              onChange={(text) =>
                updateWork(work.id, (w) => {
                  const description = { fr: '', en: '', ...w.description, [locale]: text };
                  if (description.fr || description.en) w.description = description;
                  else delete w.description;
                })
              }
            />
          ))}
        </SimpleGrid>
      </Section>

      <Section title="Affichage">
        <DisplayWidth work={work} />
        <Switch
          label="Masquer du site"
          description="L’œuvre reste ici, mais n’apparaît plus sur le site après publication."
          checked={work.hidden}
          onChange={(e) => {
            const hidden = e.currentTarget.checked;
            updateWork(work.id, (w) => {
              w.hidden = hidden;
            });
          }}
        />
      </Section>

      <Group justify="flex-end">
        <Button color="red" variant="outline" leftSection={<IconTrash size={16} />} onClick={remove}>
          Supprimer cette {KIND[kind].one}
        </Button>
      </Group>
    </Stack>
  );
}

function YearField({ work, path }: { work: Work; path: string }) {
  const error = useFieldError(`${path}.year`);
  return (
    <NumberInput
      label="Année"
      value={work.year}
      onChange={(v) => {
        if (typeof v === 'number')
          updateWork(work.id, (w) => {
            w.year = v;
          });
      }}
      min={1900}
      max={2200}
      allowDecimal={false}
      thousandSeparator=""
      error={error}
      w={140}
    />
  );
}

function ArtworkFields({ work, path }: { work: Artwork; path: string }) {
  const content = useContent();
  const priceError = useFieldError(`${path}.price`);
  const saleUrlError = useFieldError(`${path}.saleUrl`);
  const dimensionsError = useFieldError(`${path}.dimensions`);
  const media = useMemo(() => {
    const artworks = content.works.filter((w): w is Artwork => w.kind === 'artwork');
    return {
      fr: distinctValues(artworks.map((w) => w.medium?.fr)),
      en: distinctValues(artworks.map((w) => w.medium?.en)),
    };
  }, [content.works]);
  const suggested = suggestPrice(work.dimensions, content.settings.priceTable);
  const [dims, setDims] = useState<[number | undefined, number | undefined]>(work.dimensions ?? [undefined, undefined]);

  const setDimension = (i: 0 | 1, value: number | undefined) => {
    const next: [number | undefined, number | undefined] = i === 0 ? [value, dims[1]] : [dims[0], value];
    setDims(next);
    const [a, b] = next;
    updateArtwork(work.id, (w) => {
      if (a && b && a > 0 && b > 0) {
        w.dimensions = [a, b];
        // Pre-fill the price from the price table when there is none yet.
        const price = suggestPrice([a, b], content.settings.priceTable);
        if (w.price === undefined && price !== undefined) w.price = price;
      } else delete w.dimensions;
    });
  };

  return (
    <>
      <L10nInput
        label="Technique"
        value={work.medium ?? { fr: '', en: '' }}
        path={`${path}.medium`}
        placeholderEn="ex. acrylic on canvas"
        onChange={(medium) =>
          updateArtwork(work.id, (w) => {
            if (medium.fr || medium.en) w.medium = medium;
            else delete w.medium;
          })
        }
        render={(locale, props) => (
          <Autocomplete
            {...props}
            placeholder={locale === 'fr' ? 'ex. acrylique sur toile' : props.placeholder}
            data={media[locale]}
            limit={8}
          />
        )}
      />

      <Box>
        <Text size="sm" fw={500}>
          Dimensions (en pouces)
        </Text>
        <Group gap="xs" align="center">
          <NumberField
            aria-label="Largeur en pouces"
            value={dims[0]}
            onChange={(v) => setDimension(0, v)}
            min={0}
            step={0.25}
            decimalScale={2}
            w={110}
            rightSection={<Text size="sm">"</Text>}
          />
          <Text>×</Text>
          <NumberField
            aria-label="Hauteur en pouces"
            value={dims[1]}
            onChange={(v) => setDimension(1, v)}
            min={0}
            step={0.25}
            decimalScale={2}
            w={110}
            rightSection={<Text size="sm">"</Text>}
          />
          {work.dimensions && (
            <Text size="sm" c="dimmed">
              Affiché : {formatDimensions(work.dimensions)}
            </Text>
          )}
        </Group>
        {dimensionsError && (
          <Text size="xs" c="red">
            {dimensionsError}
          </Text>
        )}
      </Box>

      <Box>
        <Text size="sm" fw={500} mb={4} id="availability-label">
          Disponibilité
        </Text>
        <SegmentedControl
          aria-labelledby="availability-label"
          data={Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({ value, label }))}
          value={work.availability}
          onChange={(v) =>
            updateArtwork(work.id, (w) => {
              w.availability = v as Availability;
            })
          }
          fullWidth
          className="lb-segmented"
        />
        <Text size="xs" c="dimmed" mt={4}>
          {
            {
              available: 'Affiche « disponible » avec le prix et un lien pour l’acheter.',
              sold: 'Affiche « vendue ». Le prix est conservé mais n’est pas affiché.',
              unavailable: 'Affiche « non disponible ».',
              none: 'N’affiche rien (études, projets de résidence…).',
            }[work.availability]
          }
        </Text>
      </Box>

      <Group align="flex-end" gap="sm">
        <NumberField
          label="Prix (CAD)"
          value={work.price}
          onChange={(price) =>
            updateArtwork(work.id, (w) => {
              if (price !== undefined) w.price = Math.round(price);
              else delete w.price;
            })
          }
          min={0}
          allowDecimal={false}
          thousandSeparator=" "
          rightSection={<Text size="sm">$</Text>}
          error={priceError}
          w={160}
        />
        {suggested !== undefined && suggested !== work.price && (
          <Group gap="xs" pb={priceError ? 22 : 4}>
            <Text size="sm">Prix suggéré : {formatPrice(suggested, 'fr')}</Text>
            <Button
              size="compact-sm"
              variant="default"
              onClick={() =>
                updateArtwork(work.id, (w) => {
                  w.price = suggested;
                })
              }
            >
              Appliquer
            </Button>
          </Group>
        )}
      </Group>

      <TextInput
        label="Lien d’achat (facultatif)"
        placeholder={`Vide = courriel à ${content.settings.email} avec le numéro de l’œuvre`}
        description="Par exemple la page de l’œuvre dans la boutique d’une galerie."
        value={work.saleUrl ?? ''}
        error={saleUrlError}
        onChange={(e) => {
          const url = e.currentTarget.value.trim();
          updateArtwork(work.id, (w) => {
            if (url) w.saleUrl = url;
            else delete w.saleUrl;
          });
        }}
      />
    </>
  );
}

function ExhibitionFields({ work }: { work: Exhibition; path: string }) {
  return (
    <TextInput
      label="Lieu"
      placeholder="ex. Galerie Montcalm, Gatineau (QC)"
      value={work.venue ?? ''}
      onChange={(e) => {
        const venue = e.currentTarget.value;
        updateWork(work.id, (w) => {
          if (w.kind !== 'exhibition') return;
          if (venue) w.venue = venue;
          else delete w.venue;
        });
      }}
    />
  );
}

/** Slider with a preview of the main image at that width inside a box standing for the feed column. */
function DisplayWidth({ work }: { work: Work }) {
  const mediaUrl = useMediaUrl();
  const image = work.images[0];
  const set = (displayWidth: number) =>
    updateWork(work.id, (w) => {
      w.displayWidth = displayWidth;
    });
  return (
    <Box>
      <Text size="sm" fw={500} id="display-width-label">
        Taille dans le fil : {work.displayWidth} %
      </Text>
      <Text size="xs" c="dimmed" mb="xs">
        Largeur de l’image en pourcentage de la colonne du site. Elle donne une idée de l’échelle de l’œuvre.
      </Text>
      <Slider
        aria-labelledby="display-width-label"
        min={10}
        max={100}
        step={5}
        value={work.displayWidth}
        onChange={set}
        label={(v) => `${v} %`}
        marks={[25, 50, 75, 100].map((value) => ({ value, label: `${value} %` }))}
        mb="xl"
      />
      <Box className="lb-feed-preview" aria-hidden>
        {image ? (
          <img
            src={imageUrl(mediaUrl, image, image.widths.includes(960) ? 960 : Math.max(...image.widths))}
            alt=""
            style={{ width: `${work.displayWidth}%`, backgroundColor: image.color }}
          />
        ) : (
          <Box style={{ width: `${work.displayWidth}%` }} className="lb-feed-placeholder" />
        )}
      </Box>
    </Box>
  );
}
