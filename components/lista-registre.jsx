/**
 * Componentă pentru afișarea și gestionarea registrelor unui departament
 * @fileoverview Lista registrelor cu funcționalități CRUD în format tabular
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  BookOpen, 
  FileText, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Eye
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDeleteModal, useConfirmDelete, deleteConfigs } from "@/components/confirm-delete-modal"
import { AdaugaRegistruModal } from "@/components/adauga-registru-modal"
import { EditeazaRegistruModal } from "@/components/editeaza-registru-modal"
import { crudNotifications, notifyError } from "@/lib/notifications"
import axios from "axios"

// Skeleton pentru tabel
function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header-ul tabelului */}
      <div className="flex items-center space-x-4 border-b pb-2">
        <Skeleton className="h-4 w-[120px]" /> {/* Nume */}
        <Skeleton className="h-4 w-[80px]" />  {/* Cod */}
        <Skeleton className="h-4 w-[200px]" /> {/* Descriere */}
        <Skeleton className="h-4 w-[100px]" /> {/* Înregistrări */}
        <Skeleton className="h-4 w-[80px]" />  {/* Status */}
        <Skeleton className="h-4 w-[60px]" />  {/* An */}
        <Skeleton className="h-4 w-[120px]" /> {/* Data creării */}
        <Skeleton className="h-4 w-[120px]" /> {/* Acțiuni */}
      </div>
      
      {/* Rândurile tabelului */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-3">
          {/* Nume cu icon */}
          <div className="flex items-center gap-2 w-[120px]">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
          
          {/* Cod */}
          <Skeleton className="h-6 w-[60px] rounded-full" />
          
          {/* Descriere */}
          <Skeleton className="h-4 w-[180px]" />
          
          {/* Înregistrări cu icon */}
          <div className="flex items-center gap-1 w-[100px]">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-[30px]" />
          </div>
          
          {/* Status */}
          <Skeleton className="h-6 w-[60px] rounded-full" />
          
          {/* An */}
          <Skeleton className="h-4 w-[50px]" />
          
          {/* Data creării cu icon */}
          <div className="flex items-center gap-1 w-[120px]">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
          
          {/* Acțiuni - buton + dropdown */}
          <div className="flex items-center gap-2 w-[120px] justify-end">
            <Skeleton className="h-8 w-[90px] rounded" /> {/* Buton Vizualizează */}
            <Skeleton className="h-8 w-8 rounded" />      {/* Dropdown */}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ListaRegistre({ departmentId }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isOpen, deleteConfig, openDeleteModal, closeDeleteModal } = useConfirmDelete()
  const [editingRegistru, setEditingRegistru] = useState(null)
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Query pentru registre
  const {
    data: registreDataRaw,
    isLoading: isLoadingRegistre,
    error: errorRegistre
  } = useQuery({
    queryKey: ['registre', departmentId, selectedYear],
    queryFn: async () => {
      const response = await axios.get(`/api/registru?departmentId=${departmentId}&an=${selectedYear}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la încărcarea registrelor')
      }
      return response.data
    },
    enabled: !!departmentId,
  })

  // Query pentru departament
  const {
    data: departament,
    isLoading: isLoadingDepartament
  } = useQuery({
    queryKey: ['departament', departmentId],
    queryFn: async () => {
      const response = await axios.get(`/api/departamente/${departmentId}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la încărcarea departamentului')
      }
      return response.data.data
    },
    enabled: !!departmentId,
  })

  // Extrage registre și ani disponibili
  const registre = registreDataRaw?.data || [];
  const aniDisponibili = registreDataRaw?.ani || [currentYear];

  // Mutation pentru ștergere
  const deleteRegistruMutation = useMutation({
    mutationFn: async ({ id, nume }) => {
      const response = await axios.delete(`/api/registru/${id}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Nu s-a putut șterge registrul')
      }
      return { ...response.data, numeRegistru: nume }
    },    
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registre', departmentId] })
      crudNotifications.deleted('Registrul', data.numeRegistru)
    },    
    onError: (error) => {
      notifyError(error.message)
    }
  })
  const handleVizualizeazaRegistru = (registruId) => {
    router.push(`/dashboard/e-registratura/${departmentId}/${registruId}`)
  }
    const handleStergeRegistru = (id, nume) => {
    openDeleteModal({
      ...deleteConfigs.registru,
      itemName: nume,
      onConfirm: () => deleteRegistruMutation.mutate({ id, nume })
    })
  }
  const isLoading = isLoadingRegistre || isLoadingDepartament
  if (isLoading) {
    return (
      <div className="space-y-6 mt-8">
        {/* Header skeleton pentru Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-[180px]" />
            </div>
            <Skeleton className="h-4 w-[280px] mt-2" />
          </CardHeader>
          <CardContent>
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (errorRegistre) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{errorRegistre.message}</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['registre', departmentId] })} 
              className="mt-4"
            >
              Încearcă din nou
            </Button>
          </div>        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 mt-8">

     
      {registre.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Niciun registru</h3>              <p className="text-muted-foreground mb-4">
                Nu există registre create pentru acest departament. Adaugă primul registru pentru a începe.
              </p>
              <AdaugaRegistruModal departmentId={departmentId} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Registre ({registre.length})
            </CardTitle>
            <CardDescription>
              Lista tuturor registrelor din departament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead>Cod</TableHead>
                  <TableHead>Descriere</TableHead>
                  <TableHead>Înregistrări</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>An</TableHead>
                  <TableHead>Data creării</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registre.map((registru) => (
                  <TableRow key={registru.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        {registru.nume}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {registru.cod || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {registru.descriere || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {registru._count?.inregistrari || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={registru.activ ? "default" : "secondary"}>
                        {registru.activ ? 'Activ' : 'Inactiv'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {registru.an}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(registru.createdAt).toLocaleDateString('ro-RO')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleVizualizeazaRegistru(registru.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Vizualizează
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleVizualizeazaRegistru(registru.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Vizualizează
                            </DropdownMenuItem>                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                setEditingRegistru(registru)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editează
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleStergeRegistru(registru.id, registru.nume)}
                              disabled={deleteRegistruMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deleteRegistruMutation.isPending ? 'Se șterge...' : 'Șterge'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>        </Card>      )}

      {/* Modal Editare */}
      {editingRegistru && (
        <EditeazaRegistruModal 
          registru={editingRegistru}
          isOpen={!!editingRegistru}
          onClose={() => setEditingRegistru(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['registre', departmentId] })
            setEditingRegistru(null)
          }}
        />
      )}

      {/* Modaluri */}
      <ConfirmDeleteModal
        isOpen={isOpen}
        onClose={closeDeleteModal}
        config={deleteConfig}
        isLoading={deleteRegistruMutation.isPending}
      />
    </div>
  )
}
