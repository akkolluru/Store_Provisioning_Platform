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
import { StoreType } from '@/types/store';

export default function StoreWizard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        type: 'standard' as StoreType,
        pos: 3,
        printers: 2,
        scanners: 5,
        vlan: 100,
        ip_range: '192.168.1.0/24',
    });

    const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: ['pos', 'printers', 'scanners', 'vlan'].includes(field)
                ? parseInt(value) || 0
                : value
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        // Validation
        if (!formData.name || !formData.location) {
            setError('Name and location are required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await storeApi.create({
                name: formData.name,
                location: formData.location,
                type: formData.type,
                hardware_config: {
                    pos: formData.pos,
                    printers: formData.printers,
                    scanners: formData.scanners,
                },
                network_config: {
                    vlan: formData.vlan,
                    ip_range: formData.ip_range,
                },
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/stores');
            }, 1500);
        } catch (err: any) {
            console.error('Failed to create store:', err);
            setError(err.response?.data?.message || 'Failed to create store. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="success">Store created successfully! Redirecting...</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom>
                Create New Store
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                Fill in the details below to provision a new store
            </Typography>

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Basic Information
                    </Typography>

                    <TextField
                        fullWidth
                        label="Store Name"
                        value={formData.name}
                        onChange={handleChange('name')}
                        margin="normal"
                        required
                        placeholder="e.g., Store Alpha"
                    />

                    <TextField
                        fullWidth
                        label="Location"
                        value={formData.location}
                        onChange={handleChange('location')}
                        margin="normal"
                        required
                        placeholder="e.g., New York, NY"
                    />

                    <TextField
                        fullWidth
                        select
                        label="Store Type"
                        value={formData.type}
                        onChange={handleChange('type')}
                        margin="normal"
                        required
                    >
                        <MenuItem value="flagship">Flagship</MenuItem>
                        <MenuItem value="standard">Standard</MenuItem>
                        <MenuItem value="kiosk">Kiosk</MenuItem>
                    </TextField>

                    <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                        Hardware Configuration
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            label="POS Terminals"
                            type="number"
                            value={formData.pos}
                            onChange={handleChange('pos')}
                            margin="normal"
                            sx={{ flex: '1 1 150px' }}
                            inputProps={{ min: 1 }}
                        />
                        <TextField
                            label="Printers"
                            type="number"
                            value={formData.printers}
                            onChange={handleChange('printers')}
                            margin="normal"
                            sx={{ flex: '1 1 150px' }}
                            inputProps={{ min: 1 }}
                        />
                        <TextField
                            label="Scanners"
                            type="number"
                            value={formData.scanners}
                            onChange={handleChange('scanners')}
                            margin="normal"
                            sx={{ flex: '1 1 150px' }}
                            inputProps={{ min: 1 }}
                        />
                    </Box>

                    <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                        Network Configuration
                    </Typography>

                    <TextField
                        fullWidth
                        label="VLAN ID"
                        type="number"
                        value={formData.vlan}
                        onChange={handleChange('vlan')}
                        margin="normal"
                        inputProps={{ min: 1, max: 4094 }}
                    />

                    <TextField
                        fullWidth
                        label="IP Range"
                        value={formData.ip_range}
                        onChange={handleChange('ip_range')}
                        margin="normal"
                        placeholder="e.g., 192.168.1.0/24"
                    />

                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            startIcon={loading && <CircularProgress size={20} />}
                        >
                            {loading ? 'Creating...' : 'Create Store'}
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
