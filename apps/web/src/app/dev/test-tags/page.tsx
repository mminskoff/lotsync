import Link from "next/link";

import { DataPageLayout } from "@/components/layout/DataPageLayout";
import { Button } from "@/components/ui/button";
import { TestTagQrGrid } from "@/components/dev/TestTagQrGrid";

export default function TestTagsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="border-b px-4 py-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/pairing">Back to pairing</Link>
        </Button>
      </div>
      <DataPageLayout description="Scan these codes from your phone to test pairing before Minew hardware arrives.">
        <TestTagQrGrid />
      </DataPageLayout>
    </div>
  );
}
