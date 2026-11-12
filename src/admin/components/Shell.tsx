/** App shell: navigation, and a header with the save state, "Enregistrer" and "Publier". */
import {
  Anchor,
  AppShell,
  Box,
  Burger,
  Button,
  Group,
  List,
  Loader,
  Alert,
  NavLink,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import {
  IconAlertTriangle,
  IconBriefcase,
  IconCheck,
  IconCloudUpload,
  IconDeviceFloppy,
  IconExternalLink,
  IconFileText,
  IconHistory,
  IconId,
  IconPalette,
  IconPhoto,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { linkProps, usePath } from '../router';
import { getState, publish, save, useDirty, useStore } from '../state';
import type { ValidationIssue } from '../validation';

const NAV = [
  { path: '/oeuvres', label: 'Œuvres', icon: IconPalette },
  { path: '/expositions', label: 'Expositions', icon: IconPhoto },
  { path: '/cv', label: 'CV', icon: IconBriefcase },
  { path: '/bio', label: 'Bio', icon: IconId },
  { path: '/documents', label: 'Documents', icon: IconFileText },
  { path: '/reglages', label: 'Réglages', icon: IconSettings },
  { path: '/abonnes', label: 'Abonnés', icon: IconUsers },
  { path: '/historique', label: 'Historique', icon: IconHistory },
];

export function Shell({ children }: { children: ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const path = usePath();
  const email = useStore((s) => s.email);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={{ base: 'sm', sm: 'lg' }}
    >
      <AppShell.Header>
        <Group h="100%" px={{ base: 'xs', sm: 'md' }} justify="space-between" wrap="nowrap" gap="xs">
          <Group gap="xs" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Menu" />
            <Text className="lb-brand" visibleFrom="xs">
              Laurence Belzile
            </Text>
          </Group>
          <SaveBar />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs" aria-label="Sections">
        <AppShell.Section grow>
          {NAV.map(({ path: to, label, icon: Icon }) => (
            <NavLink
              key={to}
              {...linkProps(to)}
              onClick={(event) => {
                linkProps(to).onClick(event);
                close();
              }}
              label={label}
              leftSection={<Icon size={18} stroke={1.5} />}
              active={path === to || path.startsWith(`${to}/`)}
              aria-current={path === to ? 'page' : undefined}
              color="dark"
              variant="filled"
            />
          ))}
        </AppShell.Section>
        <AppShell.Section>
          <Stack gap={4} p="xs">
            <Anchor href="/" target="_blank" rel="noopener" size="sm" c="dark">
              <Group gap={4}>
                Voir le site <IconExternalLink size={14} />
              </Group>
            </Anchor>
            {email && (
              <Text size="xs" c="dimmed" truncate>
                {email}
              </Text>
            )}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <IssuesBanner />
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

function SaveBar() {
  const dirty = useDirty();
  const saving = useStore((s) => s.saving);
  const unpublished = useStore((s) => s.hasUnpublishedChanges);
  const deploy = useStore((s) => s.deploy);
  const needsPublish = dirty || unpublished;

  const confirmPublish = () =>
    modals.openConfirmModal({
      title: 'Publier sur le site ?',
      children: (
        <Text size="sm">
          {dirty
            ? 'Vos modifications seront d’abord enregistrées, puis le site sera mis à jour (environ deux minutes).'
            : 'Le site sera mis à jour avec la version actuelle (environ deux minutes).'}
        </Text>
      ),
      labels: { confirm: 'Publier', cancel: 'Annuler' },
      onConfirm: () => void publish(),
    });

  return (
    <Group gap="xs" wrap="nowrap">
      <Box className="lb-save-state" aria-live="polite">
        {saving ? (
          <Group gap={6} wrap="nowrap">
            <Loader size="xs" color="dark" />
            <Text size="sm">Enregistrement…</Text>
          </Group>
        ) : dirty ? (
          <Text size="sm" c="orange.8" fw={500}>
            <span className="lb-dot" /> <span className="lb-hide-mobile">Modifications </span>non enregistrées
          </Text>
        ) : (
          <Text size="sm" c="dimmed">
            <IconCheck size={14} style={{ verticalAlign: -2 }} /> Enregistré
          </Text>
        )}
      </Box>
      <Tooltip label="Raccourci : ⌘S" openDelay={600}>
        <Button
          onClick={() => void save()}
          disabled={!dirty}
          loading={saving}
          variant={dirty ? 'filled' : 'default'}
          leftSection={<IconDeviceFloppy size={18} />}
          px={{ base: 'xs', sm: 'md' }}
        >
          Enregistrer
        </Button>
      </Tooltip>
      <PublishStatus phase={deploy.phase} url={deploy.url} message={deploy.message} hidden={needsPublish} />
      <Button
        onClick={confirmPublish}
        loading={deploy.phase === 'publishing'}
        variant={needsPublish ? 'filled' : 'default'}
        color={needsPublish ? 'orange.8' : 'dark'}
        leftSection={<IconCloudUpload size={18} />}
        px={{ base: 'xs', sm: 'md' }}
        title={needsPublish ? 'Des modifications ne sont pas encore sur le site' : 'Le site est à jour'}
      >
        Publier
      </Button>
    </Group>
  );
}

function PublishStatus({
  phase,
  url,
  message,
  hidden,
}: {
  phase: string;
  url?: string | null | undefined;
  message?: string | undefined;
  hidden: boolean;
}) {
  if (phase === 'deploying') {
    return (
      <Group gap={6} wrap="nowrap" className="lb-hide-mobile">
        <Loader size="xs" color="dark" />
        <Text size="sm">Mise en ligne…</Text>
      </Group>
    );
  }
  if (hidden) return null;
  if (phase === 'live') {
    return (
      <Text size="sm" c="green.8" className="lb-hide-mobile">
        En ligne ✓
      </Text>
    );
  }
  if (phase === 'failed') {
    return (
      <Text size="sm" c="red" className="lb-hide-mobile">
        Échec de la mise en ligne{' '}
        {url && (
          <Anchor href={url} target="_blank" rel="noopener" size="sm">
            (détails)
          </Anchor>
        )}
      </Text>
    );
  }
  if (phase === 'not-triggered') {
    return (
      <Tooltip label={message ?? ''} multiline w={260}>
        <Text size="sm" c="dimmed" className="lb-hide-mobile">
          Publiée (mise en ligne non lancée)
        </Text>
      </Tooltip>
    );
  }
  return null;
}

/** Where an issue is, as an admin page. */
const issueLink = (issue: ValidationIssue): string | null => {
  const [root, index] = issue.path.split('.');
  if (root === 'works') {
    const work = getState().content?.works[Number(index)];
    return work ? `${work.kind === 'exhibition' ? '/expositions' : '/oeuvres'}/${work.id}` : null;
  }
  return { cv: '/cv', bio: '/bio', documents: '/documents', settings: '/reglages' }[root ?? ''] ?? null;
};

function IssuesBanner() {
  const issues = useStore((s) => s.issues);
  if (!issues.length) return null;
  return (
    <Alert
      color="red"
      icon={<IconAlertTriangle size={18} />}
      title="Avant d’enregistrer, corrigez ces champs"
      mb="md"
      role="alert"
    >
      <List size="sm" spacing={2}>
        {issues.slice(0, 8).map((issue) => {
          const to = issueLink(issue);
          return (
            <List.Item key={issue.path + issue.message}>
              {to ? (
                <Anchor size="sm" {...linkProps(to)}>
                  {issue.where}
                </Anchor>
              ) : (
                issue.where
              )}{' '}
              : {issue.message}
            </List.Item>
          );
        })}
        {issues.length > 8 && <List.Item>… et {issues.length - 8} autre(s)</List.Item>}
      </List>
    </Alert>
  );
}
