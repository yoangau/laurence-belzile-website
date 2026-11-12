/** Admin entry point: providers, loading, routes. */
import '@fontsource/rokkitt/400.css';
import '@fontsource/rokkitt/500.css';
import '@fontsource/rokkitt/400-italic.css';
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import './admin.css';

import { Button, Center, Loader, MantineProvider, Modal, Stack, Text, Title } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { Shell } from './components/Shell';
import { BioPage } from './pages/BioPage';
import { CvPage } from './pages/CvPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { SubscribersPage } from './pages/SubscribersPage';
import { WorkEditor } from './pages/WorkEditor';
import { WorksPage } from './pages/WorksPage';
import { matchPath, navigate, usePath } from './router';
import { getState, load, save, useDirty, useStore } from './state';
import { theme } from './theme';

export default function AdminApp() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ModalsProvider labels={{ confirm: 'Confirmer', cancel: 'Annuler' }}>
        <Notifications position="bottom-right" limit={4} />
        <Admin />
      </ModalsProvider>
    </MantineProvider>
  );
}

function Admin() {
  const status = useStore((s) => s.status);
  const loadError = useStore((s) => s.loadError);
  const dirty = useDirty();

  useEffect(() => void load(), []);

  // Warn before closing the tab or leaving the admin with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      // After a conflict she chose to reload: don't ask again.
      if (!getState().conflict) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useHotkeys([['mod+S', () => void save()]], []);

  if (status === 'loading') {
    return (
      <Center h="100vh">
        <Loader color="dark" />
      </Center>
    );
  }
  if (status === 'error') {
    return (
      <Center h="100vh" p="md">
        <Stack align="center" maw={420}>
          <Title order={2}>Impossible de charger le contenu</Title>
          <Text ta="center">{loadError}</Text>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </Stack>
      </Center>
    );
  }
  return (
    <Shell>
      <Routes />
      <ConflictModal />
    </Shell>
  );
}

function Routes() {
  const path = usePath();
  useEffect(() => {
    if (path === '/' || path === '') navigate('/oeuvres', { replace: true });
  }, [path]);

  for (const kind of ['artwork', 'exhibition'] as const) {
    const base = kind === 'artwork' ? '/oeuvres' : '/expositions';
    if (matchPath(base, path)) return <WorksPage key={kind} kind={kind} />;
    const editor = matchPath(`${base}/:id`, path);
    if (editor) return <WorkEditor key={editor.id} kind={kind} id={editor.id!} />;
  }
  switch (path) {
    case '/cv':
      return <CvPage />;
    case '/bio':
      return <BioPage />;
    case '/documents':
      return <DocumentsPage />;
    case '/reglages':
      return <SettingsPage />;
    case '/abonnes':
      return <SubscribersPage />;
    case '/historique':
      return <HistoryPage />;
    default:
      return path === '/' ? null : <Text>Page introuvable.</Text>;
  }
}

function ConflictModal() {
  const conflict = useStore((s) => s.conflict);
  return (
    <Modal
      opened={conflict}
      onClose={() => {}}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      title="Le contenu a été modifié ailleurs"
    >
      <Stack>
        <Text size="sm">
          Une autre fenêtre (ou un autre appareil) a enregistré des modifications entre-temps. Rechargez la page pour
          repartir de la dernière version. Les modifications faites ici depuis le dernier enregistrement seront perdues.
        </Text>
        <Button onClick={() => window.location.reload()}>Recharger la page</Button>
      </Stack>
    </Modal>
  );
}
