
'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';

interface UseScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isPaused: boolean;
}

export function useScanner({ onScanSuccess, isPaused }: UseScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const startScanner = useCallback(() => {
    if (!videoRef.current || !scannerRef.current || scannerRef.current.isScanning) {
      return;
    }

    setIsScanning(true);
    scannerRef.current.start(
      { facingMode: 'environment' },
      { fps: 5, qrbox: { width: 250, height: 250 } },
      (decodedText, decodedResult) => {
        onScanSuccess(decodedText);
      },
      undefined 
    ).catch(err => {
      console.error('QR Scanner Start Error:', err);
      toast({ variant: 'destructive', title: 'Scanner Error', description: 'Could not start the scanner.' });
      setIsScanning(false);
    });
  }, [onScanSuccess, toast]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
      }).catch(err => {
        console.error('QR Scanner Stop Error:', err);
      });
    }
  }, []);

  // Effect for camera permissions
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(error => {
        console.error('Camera permission error:', error);
        setHasPermission(false);
      });
  }, []);

  // Effect to initialize and cleanup the scanner
  useEffect(() => {
    if (hasPermission && videoRef.current) {
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(videoRef.current.id);
        }
    }
    
    // Cleanup function
    return () => {
        stopScanner();
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [hasPermission, stopScanner]);

  // Effect to control scanning state (pause/resume)
  useEffect(() => {
    if (isPaused) {
      stopScanner();
    } else if (hasPermission && !isScanning) {
      startScanner();
    }
  }, [isPaused, hasPermission, isScanning, startScanner, stopScanner]);

  return { videoRef, hasPermission, isScanning };
}
