"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, FileX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FileX className="h-16 w-16 text-gray-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Pagina nu a fost găsită
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Ne pare rău, pagina pe care o căutați nu există sau a fost mutată.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              asChild 
              variant="default"
              className="flex items-center gap-2"
            >
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
                Înapoi la Dashboard
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.history.back()}
            >
              <button>
                <ArrowLeft className="h-4 w-4" />
                Înapoi
              </button>
            </Button>
          </div>
          <div className="text-sm text-gray-500 mt-6">
            Cod eroare: <span className="font-mono">404</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
