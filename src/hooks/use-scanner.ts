'use client'

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface UseScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isPaused: boolean;
}

export function useScanner({ onScanSuccess, isPaused }: UseScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
      } catch (err) {
        console.error('Camera error', err);
        setHasPermission(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (hasPermission !== true) return;

    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode('qr-scanner-container');
    }

    const qr = html5QrCodeRef.current;

    const startScanner = async () => {
      if (qr.getState() === Html5QrcodeScannerState.NOT_STARTED || qr.getState() === Html5QrcodeScannerState.STOPPED) {
        try {
          setIsScanning(true);
          await qr.start(
            { facingMode: 'environment' },
            { fps: 5 },
            (decodedText: string) => {
              console.log("QR code detected:", decodedText);
              onScanSuccess(decodedText);
            }
          );
        } catch (err) {
          console.error('Scanner start error', err);
          setIsScanning(false);
        }
      }
    };

    const stopScanner = async () => {
      if (qr.getState() === Html5QrcodeScannerState.SCANNING) {
        try {
          await qr.stop();
          setIsScanning(false);
        } catch (err) {
          console.error("Error stopping scanner:", err);
        }
      }
    };

    if (!isPaused) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isPaused, hasPermission, onScanSuccess]);

  return { hasPermission, isScanning };
}