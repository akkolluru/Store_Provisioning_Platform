import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Box,
    MenuItem,
    Alert,
    CircularProgress,
} from '@mui/material';
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
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="success">
                    Store provisioning initiated! Redirecting to store list...
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom>
                Create New E-Commerce Store
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                Provision a new WooCommerce or Medusa store on Kubernetes
            </Typography>

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
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
                            startIcon={loading && <CircularProgress size={20} />}
                        >
                            {loading ? 'Provisioning...' : 'Create Store'}
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
        </Container>
    );
}
