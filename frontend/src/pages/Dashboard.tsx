import { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Alert, Box } from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import { storeApi } from '@/services/storeApi';
import { Store } from '@/types/store';
import MetricsCard from '@/components/MetricsCard';

export default function Dashboard() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    const metrics = {
        total: stores.length,
        active: stores.filter(s => s.status === 'ready' || s.status === 'active').length,
        provisioning: stores.filter(s => s.status === 'provisioning').length,
        failed: stores.filter(s => s.status === 'failed').length,
    };

    return (
        <Container maxWidth="lg" className="page-enter">
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                Overview of all stores in the platform
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box
                    sx={{
                        flex: '1 1 200px',
                        minWidth: 200,
                        animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0s backwards',
                    }}
                >
                    <MetricsCard
                        title="Total Stores"
                        value={metrics.total}
                        color="primary"
                        icon={<StoreIcon fontSize="inherit" />}
                    />
                </Box>
                <Box
                    sx={{
                        flex: '1 1 200px',
                        minWidth: 200,
                        animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards',
                    }}
                >
                    <MetricsCard
                        title="Active"
                        value={metrics.active}
                        color="success"
                        icon={<CheckCircleIcon fontSize="inherit" />}
                    />
                </Box>
                <Box
                    sx={{
                        flex: '1 1 200px',
                        minWidth: 200,
                        animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards',
                    }}
                >
                    <MetricsCard
                        title="Provisioning"
                        value={metrics.provisioning}
                        color="warning"
                        icon={<HourglassEmptyIcon fontSize="inherit" />}
                    />
                </Box>
                <Box
                    sx={{
                        flex: '1 1 200px',
                        minWidth: 200,
                        animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards',
                    }}
                >
                    <MetricsCard
                        title="Failed"
                        value={metrics.failed}
                        color="error"
                        icon={<CancelIcon fontSize="inherit" />}
                    />
                </Box>
            </Box>
        </Container>
    );
}
