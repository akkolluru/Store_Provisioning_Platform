import { AppBar, Toolbar, Typography, IconButton, Box, Chip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { APP_VERSION } from '@/config/version';

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    return (
        <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{
                        mr: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: 'rgba(99, 102, 241, 0.08)',
                            transform: 'scale(1.05)',
                        },
                    }}
                >
                    <MenuIcon />
                </IconButton>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                        }}
                    >
                        <RocketLaunchIcon sx={{ fontSize: 18, color: 'white' }} />
                    </Box>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        StorePlatform
                    </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                <Chip
                    label={`v${APP_VERSION}`}
                    size="small"
                    sx={{
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        color: '#6366f1',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 24,
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                    }}
                />
            </Toolbar>
            {/* Accent gradient line at bottom */}
            <Box
                sx={{
                    height: '2px',
                    background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 35%, #a78bfa 65%, #6366f1 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s linear infinite',
                }}
            />
        </AppBar>
    );
}
