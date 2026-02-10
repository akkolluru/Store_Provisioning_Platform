import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import StoreIcon from '@mui/icons-material/Store';
import { APP_VERSION } from '@/config/version';

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>
                <StoreIcon sx={{ mr: 1 }} />
                <Typography variant="h6" noWrap component="div">
                    Store Provisioning Platform
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    v{APP_VERSION}
                </Typography>
            </Toolbar>
        </AppBar>
    );
}
