"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pairingEslQrUrl } from "@/lib/pairing-url";
import { QRCodeSVG } from "qrcode.react";

const TEST_TAGS = ["ESL-001", "ESL-002", "ESL-003", "ESL-004", "ESL-005"];

export function TestTagQrGrid() {
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Phone scanning</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            QR codes open a pairing link in your browser — not Google. For phone
            testing, set <code className="font-mono text-xs">NEXT_PUBLIC_APP_URL</code>{" "}
            in <code className="font-mono text-xs">.env.local</code> to your Mac&apos;s
            LAN address (e.g. <code className="font-mono text-xs">http://192.168.1.42:3000</code>
            ).
          </p>
          <p className="text-xs">
            Current base URL: <span className="font-mono">{appBaseUrl}</span>
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TEST_TAGS.map((code) => {
          const url = pairingEslQrUrl(code);
          return (
            <Card key={code}>
              <CardHeader className="pb-2">
                <CardTitle className="text-center font-mono">{code}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3 pb-6">
                <QRCodeSVG value={url} size={160} />
                <p className="break-all text-center font-mono text-[10px] text-muted-foreground">
                  {url}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
