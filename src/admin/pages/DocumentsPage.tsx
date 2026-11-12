/** Documents: the PDFs linked from the menu or the CV page (catalogue, CV, press review). */
import {
  Anchor,
  Button,
  Code,
  FileButton,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconFileUpload, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { docUrl } from '../../content/format';
import { DOCUMENT_PLACEMENTS, type Document } from '../../content/schema';
import { api } from '../api';
import { L10nInput, slugify } from '../components/fields';
import { edit, useContent, useMediaUrl } from '../state';

const PLACEMENTS: Record<(typeof DOCUMENT_PLACEMENTS)[number], string> = {
  nav: 'Dans le menu du site',
  cv: 'Sur la page CV',
  none: 'Nulle part (lien direct seulement)',
};

/** A new name each time (date suffix), so visitors get the new file right away instead of a cached one. */
const uploadPdf = async (file: File, base: string): Promise<string> => {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
  const key = `docs/${slugify(base)}-${stamp}.pdf`;
  await api.upload(key, file, 'application/pdf');
  return key;
};

const isPdf = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const updateDocument = (id: string, recipe: (doc: Document) => void) =>
  edit((draft) => {
    const doc = draft.documents.find((d) => d.id === id);
    if (doc) recipe(doc);
  });

export function DocumentsPage() {
  const { documents } = useContent();
  const [adding, setAdding] = useState(false);
  return (
    <Stack gap="md" maw={980}>
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={1}>Documents</Title>
          <Text c="dimmed" size="sm">
            Les fichiers PDF (catalogue, CV, revue de presse) proposés sur le site.
          </Text>
        </div>
        <Button leftSection={<IconPlus size={18} />} onClick={() => setAdding(true)}>
          Ajouter un document
        </Button>
      </Group>
      {documents.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
      <AddDocumentModal opened={adding} onClose={() => setAdding(false)} />
    </Stack>
  );
}

function FileRow({ doc, locale }: { doc: Document; locale: 'fr' | 'en' }) {
  const mediaUrl = useMediaUrl();
  const [busy, setBusy] = useState(false);
  const key = doc.file[locale];
  const href = /^https?:/.test(key) ? key : docUrl(mediaUrl, key);
  const replace = async (file: File | null) => {
    if (!file) return;
    if (!isPdf(file)) {
      notifications.show({ color: 'red', message: 'Choisissez un fichier PDF.' });
      return;
    }
    setBusy(true);
    try {
      const uploaded = await uploadPdf(file, `${doc.id}-${locale}`);
      updateDocument(doc.id, (d) => {
        d.file[locale] = uploaded;
      });
      notifications.show({ color: 'dark', message: `PDF ${locale === 'fr' ? 'français' : 'anglais'} remplacé. Enregistrez puis publiez.` });
    } catch (error) {
      notifications.show({ color: 'red', title: 'Envoi impossible', message: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Group justify="space-between" wrap="wrap" gap="xs">
      <Text size="sm">
        <b>{locale === 'fr' ? 'Français' : 'Anglais'} :</b>{' '}
        <Anchor href={href} target="_blank" rel="noopener">
          {key.split('/').pop()}
        </Anchor>
      </Text>
      <Group gap="xs">
        {locale === 'en' && doc.file.en !== doc.file.fr && (
          <Button
            size="compact-sm"
            variant="subtle"
            color="gray"
            onClick={() =>
              updateDocument(doc.id, (d) => {
                d.file.en = d.file.fr;
              })
            }
          >
            Utiliser le PDF français
          </Button>
        )}
        <FileButton onChange={(file) => void replace(file)} accept="application/pdf,.pdf">
          {(props) => (
            <Button {...props} size="compact-sm" variant="default" loading={busy} leftSection={<IconFileUpload size={14} />}>
              Remplacer
            </Button>
          )}
        </FileButton>
      </Group>
    </Group>
  );
}

function DocumentCard({ doc }: { doc: Document }) {
  const content = useContent();
  const index = content.documents.indexOf(doc);
  const remove = () =>
    modals.openConfirmModal({
      title: `Retirer « ${doc.label.fr} » ?`,
      children: <Text size="sm">Le lien vers ce document disparaîtra du site à la prochaine publication.</Text>,
      labels: { confirm: 'Retirer', cancel: 'Annuler' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        edit((draft) => {
          draft.documents.splice(index, 1);
        }),
    });
  return (
    <Paper withBorder p={{ base: 'sm', sm: 'lg' }} radius="sm">
      <Stack gap="sm">
        <L10nInput
          label="Libellé du lien"
          value={doc.label}
          path={`documents.${index}.label`}
          onChange={(label) =>
            updateDocument(doc.id, (d) => {
              d.label = label;
            })
          }
        />
        <Select
          label="Où afficher le lien"
          data={Object.entries(PLACEMENTS).map(([value, label]) => ({ value, label }))}
          value={doc.placement}
          onChange={(v) =>
            updateDocument(doc.id, (d) => {
              d.placement = (v ?? 'none') as Document['placement'];
            })
          }
          allowDeselect={false}
          maw={360}
        />
        <FileRow doc={doc} locale="fr" />
        <FileRow doc={doc} locale="en" />
        <Group justify="space-between" align="flex-end">
          {doc.legacyPaths.length > 0 ? (
            <Text size="xs" c="dimmed">
              Anciennes adresses toujours redirigées vers ce document :{' '}
              {doc.legacyPaths.map((p) => (
                <Code key={p} mr={4}>
                  {p}
                </Code>
              ))}
            </Text>
          ) : (
            <span />
          )}
          <Button size="compact-sm" color="red" variant="subtle" leftSection={<IconTrash size={14} />} onClick={remove}>
            Retirer
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

function AddDocumentModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { documents } = useContent();
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!label.trim() || !file) return;
    setBusy(true);
    try {
      let id = slugify(label);
      while (documents.some((d) => d.id === id)) id = `${slugify(label)}-${Math.floor(Math.random() * 1000)}`;
      const key = await uploadPdf(file, id);
      edit((draft) => {
        draft.documents.push({
          id,
          label: { fr: label.trim(), en: '' },
          file: { fr: key, en: key },
          placement: 'cv',
          legacyPaths: [],
        });
      });
      setLabel('');
      setFile(null);
      onClose();
    } catch (error) {
      notifications.show({ color: 'red', title: 'Envoi impossible', message: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Ajouter un document">
      <Stack>
        <TextInput
          label="Libellé du lien"
          placeholder="ex. Télécharger le portfolio"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          data-autofocus
        />
        <FileButton onChange={setFile} accept="application/pdf,.pdf">
          {(props) => (
            <Button {...props} variant="default" leftSection={<IconFileUpload size={16} />}>
              {file ? file.name : 'Choisir le PDF'}
            </Button>
          )}
        </FileButton>
        <Text size="xs" c="dimmed">
          Le même PDF est utilisé en anglais ; vous pourrez le remplacer ensuite.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => void add()} loading={busy} disabled={!label.trim() || !file || (file && !isPdf(file))}>
            Ajouter
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
