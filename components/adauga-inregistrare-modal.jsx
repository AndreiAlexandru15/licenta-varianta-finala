'use client'

import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, FileText, Loader2, Plus } from 'lucide-react'
import { notifySuccess, notifyError } from '@/lib/notifications'
import { DatePicker } from '@/components/ui/date-picker'

export function AdaugaInregistrareModal({ 
  departamentId = null, 
  registruId = null,
  trigger = null,
  preExistingFile = null,
  isOpen: externalIsOpen = false,
  onOpenChange: externalOnOpenChange = null,  allowDepartmentSelection = false, // New prop to enable department/registry selection
  allowFileRemoval = true // New prop to control file removal capability
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Use external state if provided, otherwise internal state
  const modalIsOpen = externalOnOpenChange ? externalIsOpen : isOpen
  const setModalIsOpen = externalOnOpenChange ? externalOnOpenChange : setIsOpen
    // Funcție pentru truncarea textului
  const truncateText = (text, maxLength = 50) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }
  
  const [formData, setFormData] = useState({
    expeditor: '',
    destinatarId: '',
    obiect: '',
    observatii: '',
    dataDocument: new Date(),
    dataInregistrare: new Date(),
    tipDocumentId: '',
    fisierAtas: null,
    numarDocument: '',
  })
  const [file, setFile] = useState(null)  
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedDepartamentId, setSelectedDepartamentId] = useState(departamentId)
  const [selectedRegistruId, setSelectedRegistruId] = useState(registruId)
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()
    // Query pentru categorii fișiere (pentru fallback dacă tipul de document nu are categorie)
  const { data: categorii = [] } = useQuery({
    queryKey: ['categorii-document'],
    queryFn: async () => {
      const response = await axios.get('/api/categorii-document')
      return response.data.success ? response.data.data : []
    }
  })
  // Query pentru departamente (când este permisă selecția)
  const { data: departamente = [] } = useQuery({
    queryKey: ['departamente'],
    queryFn: async () => {
      console.log('Fetching departamente...')
      const response = await axios.get('/api/departamente')
      console.log('Response departamente:', response.data)
      return response.data.success ? response.data.data : []
    },
    enabled: allowDepartmentSelection && modalIsOpen
  })  // Query pentru registrele departamentului selectat
  const { data: registre = [], isLoading: registreLoading } = useQuery({
    queryKey: ['registre', selectedDepartamentId],
    queryFn: async () => {
      if (!selectedDepartamentId) return []
      console.log('Fetching registre pentru departamentId:', selectedDepartamentId)
      const response = await axios.get(`/api/registru?departmentId=${selectedDepartamentId}`)
      console.log('Response registre:', response.data)
      return response.data.success ? response.data.data : []
    },
    enabled: allowDepartmentSelection && modalIsOpen && !!selectedDepartamentId
  })
    // Query pentru tipurile de documente ale registrului (cu categorii incluse)
  const { data: tipuriDocumente = [] } = useQuery({
    queryKey: ['tipuri-documente', selectedRegistruId || registruId],
    queryFn: async () => {
      const registruToUse = selectedRegistruId || registruId
      if (!registruToUse) return []
      console.log('Fetching tipuri documente pentru registruId:', registruToUse)
      const response = await axios.get(`/api/tipuri-documente?registruId=${registruToUse}`)
      console.log('Response tipuri documente:', response.data)
      return response.data.success ? response.data.data : []
    },
    enabled: !!(selectedRegistruId || registruId)
  })
    // Fetch users for the department
  const { data: utilizatori = [], isLoading: utilizatoriLoading } = useQuery({
    queryKey: ['utilizatori', selectedDepartamentId || departamentId],
    queryFn: async () => {
      const departamentToUse = selectedDepartamentId || departamentId
      if (!departamentToUse) return [];
      const response = await axios.get('/api/utilizatori');
      if (!response.data.success) throw new Error('Nu s-au putut încărca utilizatorii');
      return response.data.data;
    },    enabled: modalIsOpen && !!(selectedDepartamentId || departamentId)
  })
  // Effect to handle pre-existing file
  useEffect(() => {
    if (preExistingFile && modalIsOpen) {
      console.log('Setting pre-existing file:', preExistingFile)
      setFile({
        id: preExistingFile.id,
        numeOriginal: preExistingFile.numeOriginal,
        marime: preExistingFile.marime,
        tipMime: preExistingFile.tipMime,
        extensie: preExistingFile.extensie,
        categorie: preExistingFile.categorie
      })
      setFormData(prev => ({
        ...prev,
        fisierAtas: preExistingFile.id,
        // Pre-populate some fields if available
        obiect: preExistingFile.subiect || prev.obiect,
        dataDocument: preExistingFile.dataFisier ? new Date(preExistingFile.dataFisier) : prev.dataDocument
      }))
    }
  }, [preExistingFile, modalIsOpen])

  // Effect to ensure registry is cleared when department changes
  useEffect(() => {
    if (allowDepartmentSelection && selectedDepartamentId) {
      // Only reset if we actually had a registry selected
      if (selectedRegistruId) {
        console.log('Department changed, clearing registry selection')
        setSelectedRegistruId('')
      }
    }
  }, [selectedDepartamentId, allowDepartmentSelection])// Debug effect pentru a vedea datele
  useEffect(() => {
    console.log('=== DEBUG INFO ===')
    console.log('FormData:', formData)
    console.log('Tipuri documente:', tipuriDocumente)
    console.log('Categorii:', categorii)
    console.log('Departamente:', departamente)
    console.log('Registre:', registre)
    console.log('Registre loading:', registreLoading)
    console.log('Selected departamentId:', selectedDepartamentId)
    console.log('Selected registruId:', selectedRegistruId)
    console.log('allowDepartmentSelection:', allowDepartmentSelection)
    console.log('Tip document selectat:', formData.tipDocumentId)
    console.log('Pre-existing file:', preExistingFile)
    console.log('File state:', file)
    
    if (formData.tipDocumentId && formData.tipDocumentId !== '') {
      const tipSelectat = tipuriDocumente.find(tip => tip.id === formData.tipDocumentId)
      console.log('Tip selectat găsit:', tipSelectat)
      console.log('Categoria tipului selectat:', tipSelectat?.categorie)
      console.log('CategorieId din tip:', tipSelectat?.categorieId)
    }
    console.log('==================')
  }, [formData.tipDocumentId, tipuriDocumente, categorii, departamente, registre, registreLoading, selectedDepartamentId, selectedRegistruId, allowDepartmentSelection, formData, preExistingFile, file])
  
  // Mutation pentru upload fișier
  const uploadFileMutation = useMutation({
    mutationFn: async (fileToUpload) => {
      setIsUploading(true)
      setUploadProgress(0)
      
      const formDataUpload = new FormData()
      formDataUpload.append('file', fileToUpload)
        // Adaugă departamentId pentru organizarea fișierelor
      const departamentToUse = selectedDepartamentId || departamentId
      if (departamentToUse) {
        formDataUpload.append('departamentId', departamentToUse)
      }
      
      // PROBLEMA ERA AICI - Folosește categoria din tipul de document selectat
      console.log('=== UPLOAD DEBUG ===')
      console.log('Tip document selectat pentru upload:', formData.tipDocumentId)
      console.log('Tipuri documente disponibile:', tipuriDocumente)
      
      const tipDocumentSelectat = tipuriDocumente.find(tip => tip.id === formData.tipDocumentId)
      console.log('Tip document găsit pentru upload:', tipDocumentSelectat)
      
      if (tipDocumentSelectat?.categorieId) {
        console.log('Folosind categorieId din tip document:', tipDocumentSelectat.categorieId)
        formDataUpload.append('categorieId', tipDocumentSelectat.categorieId)
      } else if (tipDocumentSelectat?.categorie?.id) {
        // Poate categoria este nested în obiectul categorie
        console.log('Folosind categoria nested:', tipDocumentSelectat.categorie.id)
        formDataUpload.append('categorieId', tipDocumentSelectat.categorie.id)
      } else {
        console.log('Nu s-a găsit categoria pentru tipul de document, folosind fallback')
        // Fallback la prima categorie dacă tipul de document nu are categorie
        if (categorii.length > 0) {
          console.log('Folosind prima categorie ca fallback:', categorii[0].id)
          formDataUpload.append('categorieId', categorii[0].id)
        } else {
          console.warn('Nu există categorii disponibile!')
        }
      }
      console.log('===================')

      try {
        const response = await axios.post('/api/fisiere', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              setUploadProgress(percentCompleted)
            }
          }
        })

        if (response.data.success) {
          return {
            id: response.data.data.id,
            numeOriginal: response.data.data.numeOriginal,
            marime: response.data.data.marime,
            tipMime: response.data.data.tipMime,
            extensie: response.data.data.extensie,
            categorie: response.data.data.categorie
          }
        } else {
          throw new Error(response.data.error || 'Eroare la încărcarea fișierului')
        }
      } catch (error) {
        console.error('Upload error:', error)
        throw new Error(error.response?.data?.error || error.message || 'Eroare la încărcarea fișierului')
      } finally {
        setIsUploading(false)
      }
    },
    onSuccess: (uploadedFile) => {
      console.log('Upload success:', uploadedFile)
      setFile(uploadedFile)
      setFormData(prev => ({
        ...prev,
        fisierAtas: uploadedFile.id
      }))
      setUploadProgress(100)
    },
    onError: (error) => {
      console.error('Upload mutation error:', error)
      notifyError(error.message)
      setUploadProgress(0)
      setIsUploading(false)
    }
  })
  // Mutation pentru ștergere fișier
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId) => {
      const response = await axios.delete(`/api/fisiere?id=${fileId}`)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la ștergerea fișierului')
      }
      return response.data
    },
    onSuccess: () => {
      console.log('File deleted successfully')
    },
    onError: (error) => {
      console.error('Delete file error:', error)
      notifyError(error.message || 'Eroare la ștergerea fișierului')
    }
  })
  // Mutation pentru actualizarea categoriei fișierului existent
  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, categorieId, departamentId }) => {
      console.log('Updating file category:', { fileId, categorieId, departamentId })
      const response = await axios.patch(`/api/fisiere/${fileId}`, {
        categorieId,
        departamentId
      })
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la actualizarea fișierului')
      }
      return response.data
    },
    onSuccess: (data) => {
      console.log('File updated successfully:', data)
      // Actualizează informațiile fișierului local
      setFile(prev => prev ? {
        ...prev,
        categorie: data.data.categorie,
        caleRelativa: data.data.caleRelativa
      } : null)
    },
    onError: (error) => {
      console.error('Update file error:', error)
      // Note: Don't show error notification here since we handle it in handleSubmit
    }
  })
    // Mutation pentru creare înregistrare
  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('=== CREATE MUTATION START ===')
      console.log('Received data:', data)
      
      // Funcție helper pentru formatarea datei
      const formatDate = (date) => {
        console.log('Formatting date:', date, 'type:', typeof date)
        if (!date) return null;
        if (typeof date === 'string') return date;
        
        // Asigură-te că data este formatată corect fără probleme de timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        console.log('Date formatted to:', formatted)
        return formatted;
      };

      // Curăță datele de valorile goale și formatează datele
      const cleanData = {
        ...data,
        tipDocumentId: data.tipDocumentId === '' ? null : data.tipDocumentId,
        destinatarId: data.destinatarId === '' ? null : data.destinatarId,
        // Folosește funcția helper pentru formatare
        dataDocument: formatDate(data.dataDocument),
        dataInregistrare: formatDate(data.dataInregistrare),
      }
      
      console.log('Clean data after formatting:', cleanData)
        const payload = {
        ...cleanData,
        registruId: selectedRegistruId || registruId,
        departamentId: selectedDepartamentId || departamentId,
        fisiereIds: cleanData.fisierAtas ? [cleanData.fisierAtas] : []
      }
      delete payload.fisierAtas
      
      console.log('Final payload to send:', payload)
      console.log('Data document in payload:', payload.dataDocument)
      console.log('Data inregistrare in payload:', payload.dataInregistrare)
      console.log('=== SENDING TO API ===')
      
      const response = await axios.post('/api/inregistrari', payload)
      
      console.log('API Response:', response.data)
      console.log('=== CREATE MUTATION END ===')
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Eroare la crearea înregistrării')
      }
      return response.data
    },
    onSuccess: (data) => {
      console.log('Registration created successfully:', data)
      notifySuccess('Înregistrarea a fost creată cu succes!')
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['inregistrari'] })
      queryClient.invalidateQueries({ queryKey: ['fisiere'] })
        resetForm()
      setModalIsOpen(false)
    },
    onError: (error) => {
      console.error('Create registration error:', error)
      notifyError(error.message || 'Nu s-a putut crea înregistrarea')
    }
  })
  
  const resetForm = () => {
    setFormData({
      expeditor: '',
      destinatarId: '',
      obiect: '',
      observatii: '',
      dataDocument: new Date(),
      dataInregistrare: new Date(),
      tipDocumentId: '',
      fisierAtas: null,
      numarDocument: '',
    })
    setFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setIsDragOver(false)
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Debug: Verifică datele înainte de trimitere
    console.log('=== SUBMIT DEBUG ===')
    console.log('dataDocument original:', formData.dataDocument)
    console.log('dataInregistrare original:', formData.dataInregistrare)
    console.log('dataDocument type:', typeof formData.dataDocument)
    console.log('dataInregistrare type:', typeof formData.dataInregistrare)
    console.log('dataDocument toISOString:', formData.dataDocument.toISOString())
    console.log('dataInregistrare toISOString:', formData.dataInregistrare.toISOString())
    console.log('Pre-existing file:', preExistingFile)
    console.log('File object:', file)
    console.log('===================')
    
    // Validări
    if (!formData.tipDocumentId || formData.tipDocumentId === '') {
      notifyError('Tipul de document este obligatoriu')
      return
    }
    if (!formData.obiect.trim()) {
      notifyError('Obiectul este obligatoriu')
      return
    }
    if (!formData.numarDocument.trim()) {
      notifyError('Numărul documentului este obligatoriu')
      return
    }    const departamentToUse = selectedDepartamentId || departamentId
    const registruToUse = selectedRegistruId || registruId
    
    if (!departamentToUse || !registruToUse) {
      notifyError('Departamentul și registrul sunt obligatorii pentru a crea înregistrarea')
      return
    }
    if (!formData.destinatarId || formData.destinatarId === '') {
      notifyError('Destinatarul este obligatoriu')
      return
    }
    if (!formData.fisierAtas) {
      notifyError('Fișierul atașat este obligatoriu')
      return
    }
    
    // If we have a pre-existing file, update its category before creating the registration
    if (preExistingFile && formData.tipDocumentId) {
      console.log('=== UPDATING PRE-EXISTING FILE ===')
      const tipDocumentSelectat = tipuriDocumente.find(tip => tip.id === formData.tipDocumentId)
      console.log('Selected document type:', tipDocumentSelectat)
      
      if (tipDocumentSelectat) {
        const categorieId = tipDocumentSelectat.categorieId || tipDocumentSelectat.categorie?.id
        console.log('Category ID to update:', categorieId)
        
        if (categorieId) {
          try {
            console.log('Updating file category for pre-existing file...')
            await updateFileMutation.mutateAsync({
              fileId: preExistingFile.id,
              categorieId: categorieId,
              departamentId: departamentToUse
            })
            console.log('File category updated successfully')
          } catch (error) {
            console.error('Failed to update file category:', error)
            notifyError('Nu s-a putut actualiza categoria fișierului')
            return
          }
        }
      }
    }
    
    console.log('Submitting form with data:', formData)
    createMutation.mutate(formData)
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    
    // Validare mărime fișier (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      notifyError('Fișierul este prea mare (max 10MB)')
      return
    }
    
    // Validare tip fișier
    const allowedTypes = [
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(selectedFile.type)) {
      notifyError('Tip de fișier neacceptat')
      return
    }

    // Verifică dacă tipul de document este selectat
    if (!formData.tipDocumentId || formData.tipDocumentId === '') {
      notifyError('Selectează mai întâi tipul de document')
      return
    }
    
    uploadFileMutation.mutate(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }
  const handleRemoveFile = () => {
    // Don't allow file removal if it's disabled (e.g., for pre-existing files from documents page)
    if (!allowFileRemoval) {
      return;
    }
    
    if (file?.id) {
      deleteFileMutation.mutate(file.id)
    }
    setFile(null)
    setFormData(prev => ({ ...prev, fisierAtas: null }))
    setUploadProgress(0)
  }

  // Obține utilizatorul selectat pentru afișare truncată
  const getSelectedUtilizator = () => {
    if (!formData.destinatarId) return null
    return utilizatori.find(u => u.id === formData.destinatarId)
  }

  // Obține tipul de document selectat pentru afișare truncată
  const getSelectedTipDocument = () => {
    if (!formData.tipDocumentId) return null
    return tipuriDocumente.find(t => t.id === formData.tipDocumentId)
  }
  // Verifică dacă tipul de document este valid
  const isTipDocumentValid = formData.tipDocumentId && formData.tipDocumentId !== ''
  return (
    <Dialog open={modalIsOpen} onOpenChange={setModalIsOpen}>
      {/* Afișează DialogTrigger */}
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adaugă înregistrare
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adaugă înregistrare nouă</DialogTitle>
        </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Department and Registry Selection (when enabled) */}
          {allowDepartmentSelection && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department Selection */}
              <div className="space-y-1">
                <Label htmlFor="departament" className="text-sm">
                  Departament <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedDepartamentId || ''}
                  onValueChange={(value) => {
                    setSelectedDepartamentId(value)
                    setSelectedRegistruId('') // Reset registry when department changes
                    setFormData(prev => ({ ...prev, tipDocumentId: '' })) // Reset document type
                  }}
                  required
                >
                  <SelectTrigger className="text-sm h-10 w-full max-w-[420px] truncate">
                    <SelectValue placeholder="Selectează departamentul" className="truncate max-w-[360px]" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamente.map(dept => (
                      <SelectItem key={dept.id} value={dept.id} className="text-sm truncate max-w-[360px]">
                        <span className="truncate block max-w-[360px]">{dept.nume}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Registry Selection */}
              <div className="space-y-1">
                <Label htmlFor="registru" className="text-sm">
                  Registru <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedRegistruId || ''}
                  onValueChange={(value) => {
                    setSelectedRegistruId(value)
                    setFormData(prev => ({ ...prev, tipDocumentId: '' })) // Reset document type
                  }}
                  required
                  disabled={!selectedDepartamentId || registreLoading}
                >
                  <SelectTrigger className="text-sm h-10 w-full max-w-[420px] truncate">
                    <SelectValue placeholder={
                      !selectedDepartamentId 
                        ? "Selectează primul departamentul" 
                        : registreLoading 
                        ? "Se încarcă..." 
                        : registre.length === 0 
                        ? "Nu există registre disponibile"
                        : "Selectează registrul"
                    } className="truncate max-w-[360px]" />
                  </SelectTrigger>
                  <SelectContent>
                    {registre.map(reg => (
                      <SelectItem key={reg.id} value={reg.id} className="text-sm truncate max-w-[360px]">
                        <span className="truncate block max-w-[360px]">{reg.nume}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Rândul 1: Expeditor | Destinatar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expeditor */}
            <div className="space-y-1">
              <Label htmlFor="expeditor" className="text-sm">
                Expeditor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expeditor"
                value={formData.expeditor}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expeditor: e.target.value
                }))}
                placeholder="Numele expeditorului"
                required
                className="text-sm"
              />
            </div>

            {/* Destinatar */}
            <div className="space-y-1">
              <Label htmlFor="destinatarId" className="text-sm">
                Destinatar <span className="text-red-500">*</span>
              </Label>              <Select
                value={formData.destinatarId}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  destinatarId: value
                }))}
                required
              >                <SelectTrigger className="text-sm h-10 max-w-full">
                  <SelectValue 
                    placeholder="Selectează destinatarul"
                    className="text-sm truncate max-w-full"
                  />
                </SelectTrigger>
                <SelectContent>
                  {utilizatori.map(utilizator => (
                    <SelectItem key={utilizator.id} value={utilizator.id} className="text-sm">
                      {truncateText(`${utilizator.nume} ${utilizator.prenume} (${utilizator.functie})`, 40)}
                    </SelectItem>
                  ))}                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rândul 2: Tip document | Număr document */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipul de document */}
            <div className="space-y-1">
              <Label htmlFor="tipDocumentId" className="text-sm">
                Tipul de document <span className="text-red-500">*</span>
              </Label>              <Select
                value={formData.tipDocumentId}
                onValueChange={(value) => {
                  console.log('Tip document selectat:', value)
                  setFormData(prev => ({
                    ...prev,
                    tipDocumentId: value
                  }))
                }}
                required
              >                <SelectTrigger className="text-sm h-10 max-w-full">
                  <SelectValue 
                    placeholder="Selectează tipul de document"
                    className="text-sm truncate max-w-full"
                  />
                </SelectTrigger>
                <SelectContent>
                  {tipuriDocumente.map(tip => (
                    <SelectItem key={tip.id} value={tip.id} className="text-sm">
                      {truncateText(`${tip.nume}${tip.categorie ? ` (${tip.categorie.nume})` : ''}`, 45)}
                    </SelectItem>
                  ))}                </SelectContent>
              </Select>
            </div>

            {/* Numărul documentului */}
            <div className="space-y-1">
              <Label htmlFor="numarDocument" className="text-sm">
                Numărul documentului <span className="text-red-500">*</span>
              </Label>
              <Input
                id="numarDocument"
                value={formData.numarDocument}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  numarDocument: e.target.value
                }))}
                placeholder="Numărul documentului"
                required
                className="text-sm"
              />
            </div>
          </div>

          {/* Rândul 3: Obiect | Observații */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Obiect */}
            <div className="space-y-1">
              <Label htmlFor="obiect" className="text-sm">
                Obiect <span className="text-red-500">*</span>
              </Label>
              <Input
                id="obiect"
                value={formData.obiect}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  obiect: e.target.value
                }))}
                placeholder="Obiectul documentului"
                required
                className="text-sm"
              />
            </div>

            {/* Observații */}
            <div className="space-y-1">
              <Label htmlFor="observatii" className="text-sm">Observații</Label>
              <Input
                id="observatii"
                value={formData.observatii}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  observatii: e.target.value
                }))}
                placeholder="Observații suplimentare (opțional)"
                className="text-sm"
              />
            </div>
          </div>          {/* Rândul 4: Data document | Data înregistrare */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data documentului */}
            <div className="space-y-1">
              <Label htmlFor="dataDocument" className="text-sm">
                Data documentului <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={formData.dataDocument}
                onChange={(date) => setFormData(prev => ({
                  ...prev,
                  dataDocument: date || new Date()
                }))}
                placeholder="Selectează data documentului"
                className="text-sm"
              />
            </div>            {/* Data înregistrării */}
            <div className="space-y-1">
              <Label htmlFor="dataInregistrare" className="text-sm">
                Data înregistrării <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={formData.dataInregistrare}
                onChange={(date) => setFormData(prev => ({
                  ...prev,
                  dataInregistrare: date || new Date()
                }))}
                placeholder="Selectează data înregistrării"
                className="text-sm"
                disabled={true}
              />
            </div>
          </div>

          {/* Upload fișier - pe toată lățimea */}
          <div className="space-y-1">
            <Label className="text-sm">
              Fișier atașat <span className="text-red-500">*</span>
            </Label>
            
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                  ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                  ${!isTipDocumentValid ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => isTipDocumentValid && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                    <p className="text-xs text-gray-600">
                      Se încarcă fișierul... {uploadProgress}%
                    </p>
                    <div className="w-32 bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-600 mb-1">
                      {isTipDocumentValid 
                        ? 'Glisează fișierul aici sau fă click pentru a selecta'
                        : 'Selectează mai întâi tipul de document'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-3 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-6 h-6 text-green-600" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-green-800 text-sm truncate">
                        {truncateText(file.numeOriginal, 30)}
                      </p>
                      <p className="text-xs text-green-600">
                        {(file.marime / 1024 / 1024).toFixed(2)} MB
                        {file.categorie && ` • ${truncateText(file.categorie.nume, 15)}`}
                      </p>
                    </div>                </div>
                  {allowFileRemoval && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Butoane */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || isUploading}
              className="flex-1 text-sm"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Se creează...
                </>
              ) : (
                'Creează înregistrarea'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"              onClick={() => {
                resetForm()
                setModalIsOpen(false)
              }}
              disabled={createMutation.isPending || isUploading}
              className="text-sm"
            >
              Anulează
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}