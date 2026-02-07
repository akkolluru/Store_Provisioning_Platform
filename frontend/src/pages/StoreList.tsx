import { Container, Typography } from '@mui/material';

export default function StoreList() {
    return (
        <Container maxWidth="lg">
            <Typography variant="h4" component="h1" gutterBottom>
                Stores
            </Typography>
            <Typography variant="body1">
                Store list will be displayed here.
            </Typography>
        </Container>
    );
}
