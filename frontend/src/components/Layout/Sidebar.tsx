import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
    Box,
    Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'All Stores', icon: <StoreIcon />, path: '/stores' },
    { text: 'Create Store', icon: <AddCircleOutlineIcon />, path: '/stores/new' },
];

const drawerWidth = 260;

export default function Sidebar({ open, onClose }: SidebarProps) {
    const location = useLocation();

    return (
        <Drawer
            variant="temporary"
            open={open}
            onClose={onClose}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    border: 'none',
                },
            }}
        >
            <Toolbar /> {/* Spacer for AppBar */}
            <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Typography
                    variant="overline"
                    sx={{
                        color: '#94a3b8',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        letterSpacing: '0.1em',
                    }}
                >
                    Navigation
                </Typography>
            </Box>
            <List sx={{ px: 1 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                onClick={onClose}
                                selected={isActive}
                                sx={{
                                    borderRadius: '10px',
                                    py: 1.2,
                                    transition: 'all 0.2s ease',
                                    ...(isActive
                                        ? {
                                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%)',
                                            borderLeft: '3px solid #6366f1',
                                            '& .MuiListItemIcon-root': {
                                                color: '#6366f1',
                                            },
                                            '& .MuiListItemText-primary': {
                                                fontWeight: 600,
                                                color: '#4f46e5',
                                            },
                                        }
                                        : {
                                            '&:hover': {
                                                backgroundColor: 'rgba(99, 102, 241, 0.04)',
                                            },
                                        }),
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 40,
                                        color: isActive ? '#6366f1' : '#94a3b8',
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: isActive ? 600 : 500,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider sx={{ mt: 'auto', mx: 2, borderColor: 'rgba(0,0,0,0.05)' }} />

            {/* Bottom branding */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudQueueIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                    Powered by Kubernetes
                </Typography>
            </Box>
        </Drawer>
    );
}
