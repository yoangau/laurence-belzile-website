/** CV: sections (titles FR/EN) and their entries (year, text FR/EN, optional link). */
import { Accordion, ActionIcon, Badge, Box, Button, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { CvEntry, CvSection } from '../../content/schema';
import type { ReactNode } from 'react';
import { L10nInput, Preview, SyntaxHelp } from '../components/fields';
import { MoveButtons, moveItem, SortableList } from '../components/Sortable';
import { randomSuffix } from '../images/upload';
import { edit, useContent, useHasErrors } from '../state';

const updateSection = (index: number, recipe: (section: CvSection) => void) =>
  edit((draft) => {
    const section = draft.cv[index];
    if (section) recipe(section);
  });

export function CvPage() {
  const { cv } = useContent();
  const moveSection = (from: number, to: number) =>
    edit((draft) => {
      moveItem(draft.cv, from, to);
    });
  const addSection = () =>
    edit((draft) => {
      draft.cv.push({ id: `section-${randomSuffix(4)}`, title: { fr: 'Nouvelle section', en: '' }, entries: [] });
    });

  return (
    <Stack gap="md" maw={1100}>
      <div>
        <Title order={1}>CV</Title>
        <Text c="dimmed" size="sm">
          Ouvrez une section pour modifier ses lignes. Dans le texte : <SyntaxHelp />
        </Text>
      </div>
      <Accordion multiple variant="separated" chevronPosition="left">
        {cv.map((section, index) => (
          <SectionItem key={section.id} section={section} index={index} count={cv.length} onMove={moveSection} />
        ))}
      </Accordion>
      <Group>
        <Button variant="default" leftSection={<IconPlus size={16} />} onClick={addSection}>
          Ajouter une section
        </Button>
      </Group>
    </Stack>
  );
}

function SectionItem({
  section,
  index,
  count,
  onMove,
}: {
  section: CvSection;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
}) {
  const hasErrors = useHasErrors(`cv.${index}.`);
  const path = `cv.${index}`;
  const remove = () =>
    modals.openConfirmModal({
      title: `Supprimer la section « ${section.title.fr} » ?`,
      children: <Text size="sm">Ses {section.entries.length} ligne(s) seront supprimées aussi.</Text>,
      labels: { confirm: 'Supprimer', cancel: 'Annuler' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        edit((draft) => {
          draft.cv.splice(index, 1);
        }),
    });
  const moveEntry = (from: number, to: number) =>
    updateSection(index, (s) => {
      moveItem(s.entries, from, to);
    });
  const addEntry = () =>
    updateSection(index, (s) => {
      s.entries.unshift({ year: String(new Date().getFullYear()), text: { fr: '', en: '' } });
    });

  return (
    <Accordion.Item value={section.id}>
      <Group wrap="nowrap" gap={0} pr="xs">
        <Accordion.Control>
          <Group gap="xs">
            <Text fw={500}>{section.title.fr || 'Sans titre'}</Text>
            <Badge variant="light" color="gray">
              {section.entries.length}
            </Badge>
            {hasErrors && <Badge color="red">À corriger</Badge>}
          </Group>
        </Accordion.Control>
        <MoveButtons index={index} count={count} onMove={onMove} labels={['Monter la section', 'Descendre la section']} />
      </Group>
      <Accordion.Panel>
        <Stack gap="md">
          <L10nInput
            label="Titre de la section"
            value={section.title}
            path={`${path}.title`}
            onChange={(title) =>
              updateSection(index, (s) => {
                s.title = title;
              })
            }
          />
          <Group justify="space-between">
            <Button size="xs" variant="default" leftSection={<IconPlus size={14} />} onClick={addEntry}>
              Ajouter une ligne en haut
            </Button>
            <Button size="xs" color="red" variant="subtle" leftSection={<IconTrash size={14} />} onClick={remove}>
              Supprimer la section
            </Button>
          </Group>
          <SortableList items={section.entries} getId={entryId(section)} onMove={moveEntry}>
            {(entry, entryIndex, handle) => (
              <EntryRow
                entry={entry}
                sectionIndex={index}
                index={entryIndex}
                count={section.entries.length}
                onMove={moveEntry}
                handle={handle}
              />
            )}
          </SortableList>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

/** Entries have no id; their position in the section is stable enough between two drags. */
const entryId = (section: CvSection) => (entry: CvEntry) => `${section.id}-${section.entries.indexOf(entry)}`;

function EntryRow({
  entry,
  sectionIndex,
  index,
  count,
  onMove,
  handle,
}: {
  entry: CvEntry;
  sectionIndex: number;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  handle: ReactNode;
}) {
  const update = (recipe: (e: CvEntry) => void) =>
    updateSection(sectionIndex, (s) => {
      const e = s.entries[index];
      if (e) recipe(e);
    });
  return (
    <Paper withBorder p="xs" mb={6} radius="sm">
      <Group align="flex-start" gap="xs" wrap="nowrap">
        <Stack gap={0} align="center">
          {handle}
          <MoveButtons index={index} count={count} onMove={onMove} />
        </Stack>
        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" align="flex-start" wrap="wrap">
            <TextInput
              label="Année"
              value={entry.year}
              onChange={(e) => {
                const year = e.currentTarget.value;
                update((en) => {
                  en.year = year;
                });
              }}
              w={120}
              placeholder="2024"
            />
            <TextInput
              label="Lien (facultatif)"
              value={entry.url ?? ''}
              placeholder="https://… ou /projet/LB00528"
              onChange={(e) => {
                const url = e.currentTarget.value.trim();
                update((en) => {
                  if (url) en.url = url;
                  else delete en.url;
                });
              }}
              style={{ flex: '1 1 240px' }}
            />
          </Group>
          <L10nInput
            label="Texte"
            value={entry.text}
            path={`cv.${sectionIndex}.entries.${index}.text`}
            onChange={(text) =>
              update((en) => {
                en.text = text;
              })
            }
          />
          {/[*[]/.test(entry.text.fr + entry.text.en) && (
            <Box className="lb-preview-box">
              <Preview text={entry.text.fr} mode="inline" />
            </Box>
          )}
        </Stack>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label="Supprimer cette ligne"
          title="Supprimer cette ligne"
          onClick={() =>
            updateSection(sectionIndex, (s) => {
              s.entries.splice(index, 1);
            })
          }
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}

