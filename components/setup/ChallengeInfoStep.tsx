'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Fade from '@mui/material/Fade';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import { useChallenge } from '@/state/context';
import { stringToColor } from '@/utils/stringToColor';
import TeamBuilder from './TeamBuilder';

export default function ChallengeInfoStep() {
  const { state, dispatch } = useChallenge();
  const { challenge } = state;
  const [playerName, setPlayerName] = useState('');

  const isDuplicate = challenge.players.some(
    (p) => p.name.toLowerCase() === playerName.trim().toLowerCase(),
  );

  const handleAddPlayer = useCallback(() => {
    const name = playerName.trim();
    if (
      name &&
      !challenge.players.some(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      dispatch({ type: 'ADD_PLAYER', name });
      setPlayerName('');
    }
  }, [playerName, challenge.players, dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddPlayer();
      }
    },
    [handleAddPlayer],
  );

  const typeConfig = {
    SINGLE: {
      icon: <PersonIcon />,
      color: 'primary' as const,
      label: '1 v 1',
      description: 'Head-to-head between 2 players',
    },
    MULTI: {
      icon: <GroupIcon />,
      color: 'info' as const,
      label: 'Multiplayer',
      description: `Multiplayer with ${challenge.players.length} players`,
    },
    TOURNAMENT: {
      icon: <EmojiEventsIcon />,
      color: 'warning' as const,
      label: 'Tournament',
      description: 'Bracket-based elimination tournament',
    },
  };

  const currentType = typeConfig[challenge.type];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ---- Challenge Details ---- */}
      <Card
        sx={{
          bgcolor: '#272932',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="h6" fontWeight={600}>
            Challenge Details
          </Typography>

          <TextField
            label="Challenge Title"
            value={challenge.title}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_CHALLENGE_CONFIG',
                config: { title: e.target.value },
              })
            }
            required
            fullWidth
            placeholder="e.g., Speed Run Championship"
            helperText={`${challenge.title.length}/100`}
            slotProps={{
              htmlInput: { maxLength: 100 },
              formHelperText: {
                sx: { textAlign: 'right', m: 0, mt: 0.5 },
              },
            }}
          />

          <TextField
            label="Description"
            value={challenge.description}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_CHALLENGE_CONFIG',
                config: { description: e.target.value },
              })
            }
            fullWidth
            multiline
            rows={2}
            placeholder="Describe the challenge rules or objectives..."
            helperText={
              challenge.description
                ? `${challenge.description.length}/500`
                : 'Optional'
            }
            slotProps={{
              htmlInput: { maxLength: 500 },
              formHelperText: {
                sx: { textAlign: 'right', m: 0, mt: 0.5 },
              },
            }}
          />

          <TextField
            label="Game Name"
            value={challenge.gameName}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_CHALLENGE_CONFIG',
                config: { gameName: e.target.value },
              })
            }
            fullWidth
            placeholder="e.g., Mario Kart 8 Deluxe"
            helperText="Optional"
            slotProps={{
              htmlInput: { maxLength: 100 },
              input: {
                startAdornment: (
                  <SportsEsportsIcon
                    sx={{ mr: 1, color: 'text.secondary' }}
                  />
                ),
              },
              formHelperText: {
                sx: { textAlign: 'right', m: 0, mt: 0.5 },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* ---- Players ---- */}
      <Card
        sx={{
          bgcolor: '#272932',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon sx={{ color: 'primary.light' }} />
              <Typography variant="h6" fontWeight={600}>
                Players
              </Typography>
              <Chip
                label={challenge.players.length}
                size="small"
                color={challenge.players.length >= 2 ? 'primary' : 'default'}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Box>

          {/* Player Input */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
              placeholder="Enter a player name..."
              slotProps={{ htmlInput: { maxLength: 50 } }}
              error={isDuplicate && playerName.trim().length > 0}
              helperText={
                isDuplicate && playerName.trim().length > 0
                  ? 'Player name already added'
                  : undefined
              }
            />
            <Button
              onClick={handleAddPlayer}
              variant="contained"
              disabled={!playerName.trim() || isDuplicate}
              startIcon={<PersonAddIcon />}
              sx={{ minWidth: 110, alignSelf: 'flex-start', mt: '1px' }}
            >
              Add
            </Button>
          </Box>

          {/* Player List */}
          {challenge.players.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                px: 2,
                borderRadius: 2,
                border: '1px dashed rgba(255,255,255,0.12)',
                bgcolor: 'rgba(255,255,255,0.02)',
              }}
            >
              <PeopleIcon
                sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Add at least 2 players to get started
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ mx: -1 }}>
              {challenge.players.map((player, index) => (
                <Fade in key={player.id}>
                  <ListItem
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() =>
                          dispatch({
                            type: 'REMOVE_PLAYER',
                            playerId: player.id,
                          })
                        }
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: 'error.light' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.03)',
                      borderRadius: 2,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.06)',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: stringToColor(player.name),
                          width: 32,
                          height: 32,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={player.name}
                      secondary={`Player ${index + 1}`}
                      slotProps={{
                        secondary: { sx: { color: 'text.disabled' } },
                      }}
                    />
                  </ListItem>
                </Fade>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* ---- Team Builder (3+ players) ---- */}
      {challenge.players.length >= 3 && <TeamBuilder />}

      {/* ---- Challenge Type & Tournament ---- */}
      <Card
        sx={{
          bgcolor: '#272932',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Challenge Type
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Chip
                  icon={currentType.icon}
                  label={currentType.label}
                  color={currentType.color}
                  sx={{ fontWeight: 600 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {currentType.description}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
