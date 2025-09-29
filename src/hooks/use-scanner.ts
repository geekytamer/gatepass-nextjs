
'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';

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

    if (!isPaused) {
      setIsScanning(true);
      html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 5,},
        (decodedText: string, decodedResult: any) => {
          console.log("QR code detected:", decodedText);
          onScanSuccess(decodedText);
        },
        (errorMessage: string) => {
          // Called for scan errors, can safely ignore or log
          // console.log("Scan error:", errorMessage);
        }
         )
        .catch((err) => {
          console.error('Scanner start error', err);
          setIsScanning(false);
        });
    } else if (html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().finally(() => setIsScanning(false));
    }

    return () => {
      html5QrCodeRef.current?.stop().catch(() => {});
    };
  }, [isPaused, hasPermission, onScanSuccess]);

  return { hasPermission, isScanning };
}
