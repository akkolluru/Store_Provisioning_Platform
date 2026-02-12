import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography,
    Paper,
    TextField,
    Button,
    Box,
    MenuItem,
    Alert,
    CircularProgress,
    Card,
    CardContent,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { storeApi } from '@/services/storeApi';
import { StoreEngine } from '@/types/store';

export default function StoreWizard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        engine: 'woocommerce' as StoreEngine,
        subdomain: '',
    });

    const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        // Validation
        if (!formData.name || !formData.subdomain) {
            setError('Store name and subdomain are required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await storeApi.create({
                name: formData.name,
                config: {
                    engine: formData.engine,
                    subdomain: formData.subdomain,
                },
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/stores');
            }, 1500);
        } catch (err: unknown) {
            console.error('Failed to create store:', err);
            const errorMessage = err instanceof Error && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : 'Failed to create store. Please try again.';
            setError(errorMessage || 'Failed to create store. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Box
                className="page-enter"
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
            >
                <Card sx={{ textAlign: 'center', maxWidth: 440, width: '100%' }}>
                    <CardContent sx={{ py: 5 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2.5,
                            }}
                        >
                            <RocketLaunchIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            Store Provisioning Started!
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Redirecting to store list...
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box className="page-enter" sx={{ maxWidth: 580, mx: 'auto' }}>
            {/* Page Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Create New Store
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Provision a new WooCommerce or Medusa store on Kubernetes
                </Typography>
            </Box>

            {/* Step Indicators */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                {['Configure', 'Deploy', 'Done'].map((step, i) => (
                    <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                ...(i === 0
                                    ? {
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        color: 'white',
                                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                                    }
                                    : {
                                        backgroundColor: 'rgba(0,0,0,0.06)',
                                        color: '#94a3b8',
                                    }),
                            }}
                        >
                            {i + 1}
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: i === 0 ? 600 : 400,
                                color: i === 0 ? '#4f46e5' : '#94a3b8',
                                fontSize: '0.75rem',
                            }}
                        >
                            {step}
                        </Typography>
                        {i < 2 && (
                            <Box
                                sx={{
                                    width: 32,
                                    height: 1,
                                    backgroundColor: 'rgba(0,0,0,0.08)',
                                    mx: 0.5,
                                }}
                            />
                        )}
                    </Box>
                ))}
            </Box>

            {/* Form Card */}
            <Paper
                sx={{
                    p: { xs: 3, md: 4 },
                    borderLeft: '3px solid #6366f1',
                    animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards',
                }}
            >
                <form onSubmit={handleSubmit}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 600,
                            color: '#6366f1',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            fontSize: '0.7rem',
                            mb: 2,
                        }}
                    >
                        Store Configuration
                    </Typography>

                    <TextField
                        fullWidth
                        label="Store Name"
                        value={formData.name}
                        onChange={handleChange('name')}
                        margin="normal"
                        required
                        placeholder="e.g., My Awesome Store"
                        helperText="Display name for your store"
                    />

                    <TextField
                        fullWidth
                        label="Subdomain"
                        value={formData.subdomain}
                        onChange={handleChange('subdomain')}
                        margin="normal"
                        required
                        placeholder="e.g., mystore"
                        helperText="Your store will be accessible at: [subdomain].local"
                    />

                    <TextField
                        fullWidth
                        select
                        label="E-Commerce Engine"
                        value={formData.engine}
                        onChange={handleChange('engine')}
                        margin="normal"
                        required
                        helperText="Select the e-commerce platform"
                    >
                        <MenuItem value="woocommerce">WooCommerce (WordPress)</MenuItem>
                        <MenuItem value="medusa" disabled>
                            Medusa (Coming Soon)
                        </MenuItem>
                    </TextField>

                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={18} /> : <RocketLaunchIcon />}
                            sx={{ px: 4 }}
                        >
                            {loading ? 'Provisioning...' : 'Deploy Store'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/stores')}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
}
