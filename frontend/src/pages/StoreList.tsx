import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
    Card,
    CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { storeApi } from '@/services/storeApi';
import { Store, StoreStatus } from '@/types/store';

const getStatusColor = (status: StoreStatus): 'success' | 'info' | 'error' | 'warning' => {
    switch (status) {
        case 'ready': case 'active': return 'success';
        case 'provisioning': return 'info';
        case 'failed': return 'error';
        case 'decommissioned': return 'warning';
        default: return 'warning';
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

    useEffect(() => {
        const hasProvisioning = stores.some(store => store.status === 'provisioning');
        if (hasProvisioning) {
            const interval = setInterval(() => {
                fetchStores();
            }, 5000);
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
            await fetchStores();
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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#a78b6b' }} />
            </Box>
        );
    }

    return (
        <Box className="page-enter">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                        E-Commerce Stores
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {stores.length} {stores.length === 1 ? 'store' : 'stores'} deployed
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <IconButton
                        onClick={fetchStores}
                        disabled={loading}
                        sx={{
                            backgroundColor: 'rgba(167, 139, 107, 0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'rgba(167, 139, 107, 0.12)',
                                transform: 'rotate(90deg)',
                            },
                        }}
                    >
                        <RefreshIcon sx={{ color: '#a78b6b', fontSize: 20 }} />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/stores/new')}
                        sx={{ px: 3 }}
                    >
                        Create Store
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {stores.length === 0 ? (
                <Card
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        animation: 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <CardContent>
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: '20px',
                                background: 'rgba(167, 139, 107, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 3,
                            }}
                        >
                            <StorefrontIcon sx={{ fontSize: 36, color: '#a78b6b' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            No stores yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 340, mx: 'auto' }}>
                            Deploy your first WooCommerce store and start selling in minutes.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/stores/new')}
                            size="large"
                            sx={{ px: 4 }}
                        >
                            Create Your First Store
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <TableContainer
                    component={Paper}
                    sx={{
                        animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards',
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Engine</TableCell>
                                <TableCell>URL</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Namespace</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stores.map((store) => (
                                <TableRow
                                    key={store.id}
                                    sx={{
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            backgroundColor: 'rgba(167, 139, 107, 0.03)',
                                        },
                                        '&:last-child td': {
                                            borderBottom: 'none',
                                        },
                                    }}
                                >
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c2418' }}>
                                            {store.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={store.engine}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                textTransform: 'capitalize',
                                                borderColor: 'rgba(44, 36, 24, 0.1)',
                                                fontSize: '0.75rem',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {store.url ? (
                                            <Link
                                                href={store.url}
                                                target="_blank"
                                                rel="noopener"
                                                sx={{
                                                    fontSize: '0.85rem',
                                                    transition: 'color 0.2s ease',
                                                    '&:hover': { color: 'primary.dark' },
                                                }}
                                            >
                                                {store.url}
                                            </Link>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">—</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={store.status}
                                            color={getStatusColor(store.status)}
                                            size="small"
                                            className={store.status === 'provisioning' ? 'status-pulse' : ''}
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: '"JetBrains Mono", monospace',
                                                fontSize: '0.72rem',
                                                color: '#a09585',
                                                backgroundColor: 'rgba(44, 36, 24, 0.03)',
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1,
                                                display: 'inline-block',
                                            }}
                                        >
                                            {store.namespace || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteClick(store)}
                                            disabled={store.status === 'provisioning'}
                                            sx={{
                                                color: '#a09585',
                                                transition: 'all 0.2s ease',
                                                '&:hover:not(:disabled)': {
                                                    color: '#c47060',
                                                    backgroundColor: 'rgba(196, 112, 96, 0.06)',
                                                },
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
                <DialogTitle sx={{ fontWeight: 600 }}>Delete Store</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{deleteDialog.store?.name}</strong>?
                        This will uninstall the Helm release and delete the namespace. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={handleDeleteCancel} disabled={deleting} sx={{ color: '#7a6e5d' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting && <CircularProgress size={16} />}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
