'use client';

/**
 * TeamBuilder Component
 * Allows players to be organized into teams for group competition.
 *
 * Features:
 * - Team mode toggle (shown when 3+ players)
 * - Create new team via dialog
 * - Team cards with editable names and assigned player chips
 * - Unassigned players pool
 * - Validation warnings for empty teams / unassigned players
 */

import { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useChallenge } from '@/state/context';
import { stringToColor } from '@/utils/stringToColor';
import type { Player, TeamDefinition } from '@/state/types';

// ─── Player Chip ──────────────────────────────────────────────────────────────

function PlayerChip({
  player,
  onAssign,
  onRemove,
  isInTeam,
}: {
  player: Player;
  onAssign?: () => void;
  onRemove?: () => void;
  isInTeam: boolean;
}) {
  return (
    <Chip
      avatar={
        <Avatar
          sx={{
            bgcolor: stringToColor(player.name),
            width: 24,
            height: 24,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {player.name.charAt(0).toUpperCase()}
        </Avatar>
      }
      label={player.name}
      onClick={onAssign}
      onDelete={onRemove}
      deleteIcon={isInTeam ? <PersonRemoveIcon /> : <PersonAddIcon />}
      variant={isInTeam ? 'filled' : 'outlined'}
      color={isInTeam ? 'primary' : 'default'}
      sx={{
        cursor: onAssign ? 'pointer' : 'default',
        '&:hover': onAssign ? { bgcolor: 'action.hover' } : undefined,
      }}
    />
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({
  team,
  players,
  unassignedPlayers,
  onNameChange,
  onAddPlayer,
  onRemovePlayer,
  onDelete,
}: {
  team: TeamDefinition;
  players: Player[];
  unassignedPlayers: Player[];
  onNameChange: (name: string) => void;
  onAddPlayer: (playerId: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(!team.name);
  const [editedName, setEditedName] = useState(team.name);

  const teamPlayers = useMemo(
    () => players.filter((p) => team.playerIds.includes(p.id)),
    [players, team.playerIds],
  );

  const handleSaveName = useCallback(() => {
    if (editedName.trim()) {
      onNameChange(editedName.trim());
      setIsEditing(false);
    }
  }, [editedName, onNameChange]);

  return (
    <Card variant="outlined" sx={{ minWidth: 250 }}>
      <CardHeader
        title={
          isEditing ? (
            <TextField
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              placeholder="Team Name"
              size="small"
              autoFocus
              slotProps={{ htmlInput: { maxLength: 30 } }}
              sx={{ maxWidth: 200 }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupsIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
                {team.name || 'Unnamed Team'}
              </Typography>
              <IconButton size="small" onClick={() => setIsEditing(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )
        }
        action={
          <IconButton onClick={onDelete} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        }
        sx={{ pb: 0 }}
      />
      <CardContent>
        {/* Team members */}
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {teamPlayers.length} member{teamPlayers.length !== 1 ? 's' : ''}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, mb: 2 }}>
          {teamPlayers.map((player) => (
            <PlayerChip
              key={player.id}
              player={player}
              onRemove={() => onRemovePlayer(player.id)}
              isInTeam
            />
          ))}
          {teamPlayers.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              No members yet
            </Typography>
          )}
        </Box>

        {/* Quick add from unassigned */}
        {unassignedPlayers.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Add to team:
            </Typography>
            <Box
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}
            >
              {unassignedPlayers.slice(0, 5).map((player) => (
                <Chip
                  key={player.id}
                  label={player.name}
                  size="small"
                  onClick={() => onAddPlayer(player.id)}
                  icon={<PersonAddIcon />}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
              {unassignedPlayers.length > 5 && (
                <Chip
                  label={`+${unassignedPlayers.length - 5} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamBuilder() {
  const { state, dispatch } = useChallenge();
  const { challenge } = state;
  const { players, teams, isTeamBased } = challenge;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  // Only render when 3+ players
  if (players.length < 3) return null;

  // Compute assigned / unassigned
  const assignedIds = new Set(teams.flatMap((t) => t.playerIds));
  const unassignedPlayers = players.filter((p) => !assignedIds.has(p.id));
  const hasEmptyTeams = teams.some((t) => t.playerIds.length === 0);

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      dispatch({ type: 'ADD_TEAM', name: newTeamName.trim() });
      setNewTeamName('');
      setCreateDialogOpen(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        bgcolor: '#272932',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Team mode toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: isTeamBased ? 3 : 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: isTeamBased ? 'primary.main' : 'action.hover',
              color: isTeamBased ? 'primary.contrastText' : 'text.secondary',
              transition: 'all 0.2s',
            }}
          >
            <GroupsIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Team Mode
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Divide players into teams that compete against each other
            </Typography>
          </Box>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={isTeamBased}
              onChange={(e) =>
                dispatch({
                  type: 'TOGGLE_TEAM_MODE',
                  enabled: e.target.checked,
                })
              }
              color="primary"
            />
          }
          label=""
        />
      </Box>

      {/* Team configuration (when enabled) */}
      <Collapse in={isTeamBased}>
        <Stack spacing={3}>
          {/* Validation warnings */}
          {hasEmptyTeams && (
            <Alert severity="warning">
              Some teams have no members. Add players or remove empty teams.
            </Alert>
          )}
          {unassignedPlayers.length > 0 && teams.length > 0 && (
            <Alert severity="warning">
              {unassignedPlayers.length} player
              {unassignedPlayers.length !== 1 ? 's' : ''} not assigned to a
              team.
            </Alert>
          )}

          {/* Teams grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                players={players}
                unassignedPlayers={unassignedPlayers}
                onNameChange={(name) =>
                  dispatch({ type: 'RENAME_TEAM', teamId: team.id, name })
                }
                onAddPlayer={(playerId) =>
                  dispatch({
                    type: 'ASSIGN_PLAYER_TO_TEAM',
                    playerId,
                    teamId: team.id,
                  })
                }
                onRemovePlayer={(playerId) =>
                  dispatch({
                    type: 'REMOVE_PLAYER_FROM_TEAM',
                    playerId,
                    teamId: team.id,
                  })
                }
                onDelete={() =>
                  dispatch({ type: 'REMOVE_TEAM', teamId: team.id })
                }
              />
            ))}

            {/* Add team button card */}
            <Card
              variant="outlined"
              sx={{
                minWidth: 250,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'transparent',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.light',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => setCreateDialogOpen(true)}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <AddIcon
                  sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Create New Team
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Unassigned players pool */}
          {unassignedPlayers.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <PersonIcon color="action" />
                <Typography variant="subtitle2">
                  Unassigned Players ({unassignedPlayers.length})
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1 }}
              >
                Click &quot;Add to team&quot; on a team card above, or create a
                new team
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {unassignedPlayers.map((player) => (
                  <PlayerChip
                    key={player.id}
                    player={player}
                    isInTeam={false}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Info about team scoring */}
          <Alert severity="info" icon={<InfoOutlinedIcon />}>
            <Typography variant="body2">
              <strong>Team Scoring:</strong> In team mode, scores are entered
              per team (not per individual player). The leaderboard ranks teams
              against each other.
            </Typography>
          </Alert>
        </Stack>
      </Collapse>

      {/* Create team dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Team Name"
            placeholder="e.g., Team Alpha, Red Team"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
            fullWidth
            sx={{ mt: 1 }}
            slotProps={{ htmlInput: { maxLength: 30 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTeam}
            variant="contained"
            disabled={!newTeamName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
