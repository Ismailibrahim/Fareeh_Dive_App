"use client";

import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DigitalSignatureProps {
    onSignatureChange?: (signatureData: string | null) => void;
    initialSignature?: string;
    width?: number;
    height?: number;
    className?: string;
}

export function DigitalSignature({
    onSignatureChange,
    initialSignature,
    width = 600,
    height = 200,
    className = "",
}: DigitalSignatureProps) {
    const sigPadRef = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        if (initialSignature && sigPadRef.current) {
            sigPadRef.current.fromDataURL(initialSignature);
            setIsEmpty(false);
        }
    }, [initialSignature]);

    const handleEnd = () => {
        if (sigPadRef.current) {
            const dataURL = sigPadRef.current.toDataURL("image/png");
            setIsEmpty(sigPadRef.current.isEmpty());
            onSignatureChange?.(dataURL);
        }
    };

    const handleClear = () => {
        if (sigPadRef.current) {
            sigPadRef.current.clear();
            setIsEmpty(true);
            onSignatureChange?.(null);
        }
    };

    return (
        <Card className={className}>
            <CardContent className="p-4">
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                        Please sign in the box below
                    </p>
                </div>
                <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white">
                    <SignatureCanvas
                        ref={sigPadRef}
                        canvasProps={{
                            width,
                            height,
                            className: "signature-canvas w-full",
                        }}
                        onEnd={handleEnd}
                    />
                </div>
                {initialSignature && (
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Current Signature:</p>
                        <img
                            src={initialSignature}
                            alt="Signature"
                            className="border rounded max-w-full h-auto"
                        />
                    </div>
                )}
                <div className="mt-4 flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClear}
                        disabled={isEmpty}
                    >
                        Clear
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
