import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    Box,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Link,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { storeApi } from '@/services/storeApi';
import { Store, StoreStatus } from '@/types/store';

const getStatusColor = (status: StoreStatus): 'success' | 'info' | 'error' | 'warning' => {
    switch (status) {
        case 'ready':
            return 'success';
        case 'active':
            return 'success';
        case 'provisioning':
            return 'info';
        case 'failed':
            return 'error';
        case 'decommissioned':
            return 'warning';
        default:
            return 'warning';
    }
};

export default function StoreList() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; store: Store | null }>({
        open: false,
        store: null,
    });
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStores();
    }, []);

    // Auto-refresh for stores in provisioning status
    useEffect(() => {
        const hasProvisioning = stores.some(store => store.status === 'provisioning');
        if (hasProvisioning) {
            const interval = setInterval(() => {
                fetchStores();
            }, 5000); // Poll every 5 seconds
            return () => clearInterval(interval);
        }
    }, [stores]);

    const fetchStores = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await storeApi.getAll();
            setStores(data.stores);
        } catch (err) {
            console.error('Failed to fetch stores:', err);
            setError('Failed to load stores. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (store: Store) => {
        setDeleteDialog({ open: true, store });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.store) return;

        try {
            setDeleting(true);
            await storeApi.delete(deleteDialog.store.id);
            setDeleteDialog({ open: false, store: null });
            await fetchStores(); // Refresh list
        } catch (err) {
            console.error('Failed to delete store:', err);
            setError('Failed to delete store. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, store: null });
    };

    if (loading && stores.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        E-Commerce Stores
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {stores.length} {stores.length === 1 ? 'store' : 'stores'} total
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={fetchStores} disabled={loading} color="primary">
                        <RefreshIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/stores/new')}
                    >
                        Create Store
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Engine</strong></TableCell>
                            <TableCell><strong>URL</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Namespace</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stores.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                        No stores found. Create your first store to get started!
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            stores.map((store) => (
                                <TableRow key={store.id} hover>
                                    <TableCell>{store.name}</TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>
                                        {store.engine}
                                    </TableCell>
                                    <TableCell>
                                        {store.url ? (
                                            <Link href={store.url} target="_blank" rel="noopener">
                                                {store.url}
                                            </Link>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                -
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={store.status}
                                            color={getStatusColor(store.status)}
                                            size="small"
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: 'monospace',
                                                fontSize: '0.75rem',
                                                color: 'text.secondary',
                                            }}
                                        >
                                            {store.namespace || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteClick(store)}
                                            disabled={store.status === 'provisioning'}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
                <DialogTitle>Delete Store</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{deleteDialog.store?.name}</strong>?
                        This will uninstall the Helm release and delete the namespace. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting && <CircularProgress size={20} />}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
