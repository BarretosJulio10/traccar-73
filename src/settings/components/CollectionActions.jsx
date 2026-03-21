import { useState } from 'react';
import { Menu, MenuItem, useMediaQuery, useTheme } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import RemoveDialog from '../../common/components/RemoveDialog';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useHudTheme } from '../../common/util/ThemeContext';

const CollectionActions = ({
  itemId,
  editPath,
  endpoint,
  setTimestamp,
  customActions,
  readonly,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();
  const { theme: hudTheme } = useHudTheme();

  const phone = useMediaQuery(theme.breakpoints.down('sm'));

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [removing, setRemoving] = useState(false);

  const handleEdit = () => {
    navigate(`${editPath}/${itemId}`);
    setMenuAnchorEl(null);
  };

  const handleRemove = () => {
    setRemoving(true);
    setMenuAnchorEl(null);
  };

  const handleCustom = (action) => {
    action.handler(itemId);
    setMenuAnchorEl(null);
  };

  const handleRemoveResult = (removed) => {
    setRemoving(false);
    if (removed) {
      setTimestamp(Date.now());
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {!readonly && (
          <>
            {editPath && (
              <button
                onClick={handleEdit}
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md border active:scale-95 transition-all"
                style={{ background: hudTheme.bgSecondary, borderColor: hudTheme.border, color: hudTheme.textMuted }}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </button>
            )}
            <button
              onClick={handleRemove}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md border active:scale-95 transition-all"
              style={{ background: hudTheme.bgSecondary, borderColor: hudTheme.border, color: '#ef444499' }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </button>
          </>
        )}

        {(customActions || phone) && (
          <button
            onClick={(event) => setMenuAnchorEl(event.currentTarget)}
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md border active:scale-95 transition-all"
            style={{ background: hudTheme.bgSecondary, borderColor: hudTheme.border, color: hudTheme.textMuted }}
          >
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </button>
        )}

        <Menu
          open={!!menuAnchorEl}
          anchorEl={menuAnchorEl}
          onClose={() => setMenuAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1,
              bgcolor: hudTheme.bgSecondary,
              borderRadius: '20px',
              border: `1px solid ${hudTheme.border}`,
              boxShadow: hudTheme.sidebarShadow,
              '& .MuiMenuItem-root': {
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: hudTheme.textMuted,
                py: 1.5,
                px: 3,
                '&:hover': {
                  bgcolor: `${hudTheme.accent}15`,
                  color: hudTheme.accent
                }
              }
            }
          }}
        >
          {customActions &&
            customActions.map((action) => (
              <MenuItem onClick={() => handleCustom(action)} key={action.key}>
                {action.title}
              </MenuItem>
            ))}
        </Menu>
      </div>

      <RemoveDialog
        open={removing}
        endpoint={endpoint}
        itemId={itemId}
        onResult={handleRemoveResult}
      />
    </>
  );
};

export default CollectionActions;
