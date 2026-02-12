import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography,
    CircularProgress,
    Alert,
    Box,
    Card,
    CardContent,
    Button,
    Chip,
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { storeApi } from '@/services/storeApi';
import { Store } from '@/types/store';
import MetricsCard from '@/components/MetricsCard';

export default function Dashboard() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await storeApi.getAll();
            setStores(data.stores);
        } catch (err) {
            console.error('Failed to fetch stores:', err);
            setError('Failed to load store data. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#6366f1' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
            </Box>
        );
    }

    const metrics = {
        total: stores.length,
        active: stores.filter(s => s.status === 'ready' || s.status === 'active').length,
        provisioning: stores.filter(s => s.status === 'provisioning').length,
        failed: stores.filter(s => s.status === 'failed').length,
    };

    const recentStores = stores.slice(0, 5);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': case 'active': return '#10b981';
            case 'provisioning': return '#f59e0b';
            case 'failed': return '#ef4444';
            default: return '#94a3b8';
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <Box className="page-enter">
            {/* ─── Hero Banner ─── */}
            <Card
                sx={{
                    mb: 4,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6366f1 100%)',
                    backgroundSize: '200% 200%',
                    color: 'white',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards',
                }}
            >
                {/* Decorative circles */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -40,
                        right: -40,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -60,
                        right: 80,
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.04)',
                    }}
                />
                <CardContent sx={{ position: 'relative', zIndex: 1, py: 4, px: { xs: 3, md: 4 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <RocketLaunchIcon sx={{ fontSize: 28 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Store Provisioning Platform
                        </Typography>
                    </Box>
                    <Typography
                        variant="body1"
                        sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, maxWidth: 500 }}
                    >
                        Deploy and manage isolated e-commerce stores on Kubernetes with one click.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/stores/new')}
                        sx={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            color: 'white',
                            fontWeight: 600,
                            px: 3,
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            },
                        }}
                    >
                        Create New Store
                    </Button>
                </CardContent>
            </Card>

            {/* ─── Metrics Grid ─── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>
                {[
                    { title: 'Total Stores', value: metrics.total, color: 'primary' as const, icon: <StoreIcon fontSize="inherit" />, delay: '0s' },
                    { title: 'Active', value: metrics.active, color: 'success' as const, icon: <CheckCircleIcon fontSize="inherit" />, delay: '0.08s' },
                    { title: 'Provisioning', value: metrics.provisioning, color: 'warning' as const, icon: <HourglassEmptyIcon fontSize="inherit" />, delay: '0.16s' },
                    { title: 'Failed', value: metrics.failed, color: 'error' as const, icon: <CancelIcon fontSize="inherit" />, delay: '0.24s' },
                ].map((m) => (
                    <Box
                        key={m.title}
                        sx={{ animation: `fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${m.delay} backwards` }}
                    >
                        <MetricsCard title={m.title} value={m.value} color={m.color} icon={m.icon} />
                    </Box>
                ))}
            </Box>

            {/* ─── Bottom Grid: Recent Stores + Quick Actions ─── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                {/* Recent Stores */}
                <Card
                    sx={{
                        animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards',
                    }}
                >
                    <CardContent sx={{ p: 0 }}>
                        <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                                Recent Stores
                            </Typography>
                            <Chip
                                label={`${stores.length} total`}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                    color: '#6366f1',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    height: 22,
                                }}
                            />
                        </Box>

                        {recentStores.length === 0 ? (
                            <Box sx={{ px: 3, pb: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                    No stores yet. Create your first store to get started!
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                {recentStores.map((store, index) => (
                                    <Box
                                        key={store.id}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            px: 3,
                                            py: 1.5,
                                            borderTop: index === 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                                            transition: 'background-color 0.15s ease',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'rgba(99, 102, 241, 0.03)',
                                            },
                                        }}
                                        onClick={() => navigate('/stores')}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: getStatusColor(store.status),
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>
                                                    {store.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    {store.engine} • {store.status}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTimeIcon sx={{ fontSize: 12, color: '#cbd5e1' }} />
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                                {timeAgo(store.created_at)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.4s backwards',
                    }}
                >
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>
                        Quick Actions
                    </Typography>

                    {[
                        {
                            icon: <AddIcon />,
                            title: 'Create Store',
                            desc: 'Launch a new WooCommerce store',
                            gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            onClick: () => navigate('/stores/new'),
                        },
                        {
                            icon: <ListAltIcon />,
                            title: 'View All Stores',
                            desc: 'Manage existing deployments',
                            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            onClick: () => navigate('/stores'),
                        },
                        {
                            icon: <RefreshIcon />,
                            title: 'Refresh Data',
                            desc: 'Fetch latest store statuses',
                            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            onClick: fetchStores,
                        },
                    ].map((action) => (
                        <Card
                            key={action.title}
                            onClick={action.onClick}
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px -5px rgba(99, 102, 241, 0.15)',
                                },
                            }}
                        >
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '10px',
                                        background: action.gradient,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        flexShrink: 0,
                                    }}
                                >
                                    {action.icon}
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                                        {action.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        {action.desc}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
