import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Alert, Paper, Stack, Grid } from '@mui/material';
import api from '../../lib/api';
import { toast } from 'sonner';

export const MFASetup = ({ onComplete }: { onComplete: () => void }) => {
    const [step, setStep] = useState<'initial' | 'setup' | 'verify'>('initial');
    const [secret, setSecret] = useState<{ secret: string; qrCode: string } | null>(null);
    const [token, setToken] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    const startSetup = async () => {
        try {
            const data = await api.post('/auth/mfa/setup', {});
            setSecret(data);
            setStep('setup');
        } catch (error) {
            toast.error('Failed to start MFA setup');
        }
    };

    const handleVerify = async () => {
        try {
            const { backupCodes } = await api.post('/auth/mfa/enable', { token });
            setBackupCodes(backupCodes);
            setStep('verify'); // Success step (showing backup codes)
            toast.success('MFA Enabled Successfully');
        } catch (error) {
            toast.error('Invalid verification code');
        }
    };

    const finish = () => {
        onComplete();
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>Two-Factor Authentication</Typography>

            {step === 'initial' && (
                <Box>
                    <Typography paragraph>
                        Protect your account with an extra layer of security. Once configured, you'll be required to enter a code from your authenticator app when you log in.
                    </Typography>
                    <Button variant="contained" onClick={startSetup}>Setup MFA</Button>
                </Box>
            )}

            {step === 'setup' && secret && (
                <Stack spacing={3}>
                    <Typography>1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <img src={secret.qrCode} alt="MFA QR Code" />
                    </Box>
                    <Typography variant="caption" align="center">Secret key: {secret.secret}</Typography>

                    <Typography>2. Enter the 6-digit code from your app:</Typography>
                    <TextField
                        label="Verification Code"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        inputProps={{ maxLength: 6 }}
                    />
                    <Button variant="contained" onClick={handleVerify} disabled={token.length !== 6}>Verify & Enable</Button>
                </Stack>
            )}

            {step === 'verify' && (
                <Stack spacing={3}>
                    <Alert severity="success">MFA is now enabled!</Alert>
                    <Typography>
                        Save these backup codes in a secure place. You can use them to access your account if you lose your device.
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Grid container spacing={1}>
                            {backupCodes.map(code => (
                                <Grid size={{ xs: 6 }} key={code}>
                                    <Typography sx={{ fontFamily: 'monospace' }}>{code}</Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                    <Button variant="contained" onClick={finish}>Done</Button>
                </Stack>
            )}
        </Paper>
    );
};


