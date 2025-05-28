/**
 * Seed pentru baza de date - Date inițiale pentru aplicația E-Registratură
 * @fileoverview Populează baza de date cu roluri, permisiuni și date de bază
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Rolurile predefinite în sistem
 */
const ROLURI_INITIALE = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    nume: 'Super Admin',
    descriere: 'Acces complet la sistem',
    nivelAcces: 4,
    sistem: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    nume: 'Administrator',
    descriere: 'Administrator primărie',
    nivelAcces: 3,
    sistem: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    nume: 'Operator Registratură',
    descriere: 'Operator pentru înregistrarea documentelor',
    nivelAcces: 2,
    sistem: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    nume: 'Arhivist',
    descriere: 'Responsabil cu arhivarea documentelor',
    nivelAcces: 2,
    sistem: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    nume: 'Cititor',
    descriere: 'Doar citirea documentelor',
    nivelAcces: 1,
    sistem: true
  }
]

/**
 * Permisiunile din sistem
 */
const PERMISIUNI_INITIALE = [
  // Permisiuni documente
  { id: '650e8400-e29b-41d4-a716-446655440001', nume: 'documente_citire', descriere: 'Citirea documentelor', modul: 'documente', actiune: 'citire' },
  { id: '650e8400-e29b-41d4-a716-446655440002', nume: 'documente_creare', descriere: 'Crearea documentelor noi', modul: 'documente', actiune: 'creare' },
  { id: '650e8400-e29b-41d4-a716-446655440003', nume: 'documente_editare', descriere: 'Editarea documentelor existente', modul: 'documente', actiune: 'editare' },
  { id: '650e8400-e29b-41d4-a716-446655440004', nume: 'documente_stergere', descriere: 'Ștergerea documentelor', modul: 'documente', actiune: 'stergere' },
  { id: '650e8400-e29b-41d4-a716-446655440005', nume: 'documente_export', descriere: 'Export documente', modul: 'documente', actiune: 'export' },
  { id: '650e8400-e29b-41d4-a716-446655440006', nume: 'documente_arhivare', descriere: 'Arhivarea documentelor', modul: 'documente', actiune: 'arhivare' },
  
  // Permisiuni utilizatori
  { id: '650e8400-e29b-41d4-a716-446655440007', nume: 'utilizatori_citire', descriere: 'Vizualizarea utilizatorilor', modul: 'utilizatori', actiune: 'citire' },
  { id: '650e8400-e29b-41d4-a716-446655440008', nume: 'utilizatori_creare', descriere: 'Crearea utilizatorilor', modul: 'utilizatori', actiune: 'creare' },
  { id: '650e8400-e29b-41d4-a716-446655440009', nume: 'utilizatori_editare', descriere: 'Editarea utilizatorilor', modul: 'utilizatori', actiune: 'editare' },
  { id: '650e8400-e29b-41d4-a716-446655440010', nume: 'utilizatori_stergere', descriere: 'Ștergerea utilizatorilor', modul: 'utilizatori', actiune: 'stergere' },
  
  // Permisiuni rapoarte
  { id: '650e8400-e29b-41d4-a716-446655440011', nume: 'rapoarte_vizualizare', descriere: 'Vizualizarea rapoartelor', modul: 'rapoarte', actiune: 'vizualizare' },
  { id: '650e8400-e29b-41d4-a716-446655440012', nume: 'rapoarte_export', descriere: 'Export rapoarte', modul: 'rapoarte', actiune: 'export' },
  { id: '650e8400-e29b-41d4-a716-446655440013', nume: 'rapoarte_avansate', descriere: 'Rapoarte avansate și statistici', modul: 'rapoarte', actiune: 'avansate' },
  
  // Permisiuni sistem
  { id: '650e8400-e29b-41d4-a716-446655440014', nume: 'sistem_configurare', descriere: 'Configurarea sistemului', modul: 'sistem', actiune: 'configurare' },
  { id: '650e8400-e29b-41d4-a716-446655440015', nume: 'sistem_backup', descriere: 'Gestionarea backup-urilor', modul: 'sistem', actiune: 'backup' },
  { id: '650e8400-e29b-41d4-a716-446655440016', nume: 'sistem_audit', descriere: 'Accesul la logurile de audit', modul: 'sistem', actiune: 'audit' },
  
  // Permisiuni fonduri arhivă
  { id: '650e8400-e29b-41d4-a716-446655440017', nume: 'fonduri_gestionare', descriere: 'Gestionarea fondurilor de arhivă', modul: 'fonduri', actiune: 'gestionare' },
  { id: '650e8400-e29b-41d4-a716-446655440018', nume: 'categorii_gestionare', descriere: 'Gestionarea categoriilor de documente', modul: 'categorii', actiune: 'gestionare' }
]

/**
 * Categoriile de documente standard pentru primării
 */
const CATEGORII_DOCUMENTE_INITIALE = [
  {
    nume: 'Hotărâri Consiliu Local',
    cod: 'HCL',
    descriere: 'Hotărâri ale Consiliului Local',
    perioadaRetentie: 50,
    confidentialitateDefault: 'public'
  },
  {
    nume: 'Dispoziții Primar',
    cod: 'DP',
    descriere: 'Dispoziții ale Primarului',
    perioadaRetentie: 25,
    confidentialitateDefault: 'public'
  },
  {
    nume: 'Contracte',
    cod: 'CONTR',
    descriere: 'Contracte și convenții',
    perioadaRetentie: 10,
    confidentialitateDefault: 'confidential'
  },
  {
    nume: 'Corespondență',
    cod: 'COR',
    descriere: 'Corespondență oficială',
    perioadaRetentie: 5,
    confidentialitateDefault: 'public'
  },
  {
    nume: 'Procese Verbale',
    cod: 'PV',
    descriere: 'Procese verbale diverse',
    perioadaRetentie: 10,
    confidentialitateDefault: 'public'
  }
]

/**
 * Funcție principală de seed
 */
async function main() {
  console.log('🌱 Începe popularea bazei de date...')

  try {
    // 1. Șterge datele existente (în ordine pentru a respecta foreign keys)
    await prisma.utilizatorRol.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.utilizator.deleteMany()
    await prisma.primaria.deleteMany()
    await prisma.rolPermisiune.deleteMany()
    await prisma.permisiune.deleteMany()
    await prisma.rol.deleteMany()
    await prisma.categorieDocument.deleteMany()

    console.log('🗑️  Date existente șterse')

    // 2. Creează primăria de test
    const primariaTest = await prisma.primaria.create({
      data: {
        id: '450e8400-e29b-41d4-a716-446655440001',
        nume: 'Primăria Municipiului București Sector 1',
        codSiruta: '40011',
        judet: 'București',
        localitate: 'București',
        adresa: 'Calea Griviței nr. 1, București',
        contactInfo: {
          telefon: '021.555.0001',
          email: 'contact@sector1.ro',
          website: 'www.sector1.ro'
        },
        configurari: {
          logoPath: null,
          culoareTema: '#0066cc',
          timezone: 'Europe/Bucharest'
        }
      }
    })
    console.log('🏛️  Primăria de test creată')

    // 3. Creează rolurile
    for (const rol of ROLURI_INITIALE) {
      await prisma.rol.create({
        data: rol
      })
    }
    console.log('👥 Roluri create')

    // 4. Creează permisiunile
    for (const permisiune of PERMISIUNI_INITIALE) {
      await prisma.permisiune.create({
        data: permisiune
      })
    }
    console.log('🔐 Permisiuni create')

    // 5. Atribuie permisiuni la roluri

    // Super Admin - toate permisiunile
    const toatePermisiunile = await prisma.permisiune.findMany()
    for (const permisiune of toatePermisiunile) {
      await prisma.rolPermisiune.create({
        data: {
          rolId: '550e8400-e29b-41d4-a716-446655440001',
          permisiuneId: permisiune.id
        }
      })
    }

    // Administrator - majoritatea permisiunilor (fără sistem_configurare)
    const permisiuniAdmin = toatePermisiunile.filter(p => p.nume !== 'sistem_configurare')
    for (const permisiune of permisiuniAdmin) {
      await prisma.rolPermisiune.create({
        data: {
          rolId: '550e8400-e29b-41d4-a716-446655440002',
          permisiuneId: permisiune.id
        }
      })
    }

    // Operator Registratură
    const permisiuniOperator = [
      'documente_citire', 'documente_creare', 'documente_editare', 
      'documente_export', 'rapoarte_vizualizare', 'rapoarte_export'
    ]
    for (const numePermisiune of permisiuniOperator) {
      const permisiune = await prisma.permisiune.findUnique({
        where: { nume: numePermisiune }
      })
      if (permisiune) {
        await prisma.rolPermisiune.create({
          data: {
            rolId: '550e8400-e29b-41d4-a716-446655440003',
            permisiuneId: permisiune.id
          }
        })
      }
    }

    // Arhivist
    const permisiuniArhivist = [
      'documente_citire', 'documente_editare', 'documente_export', 
      'documente_arhivare', 'fonduri_gestionare', 'categorii_gestionare',
      'rapoarte_vizualizare', 'rapoarte_export'
    ]
    for (const numePermisiune of permisiuniArhivist) {
      const permisiune = await prisma.permisiune.findUnique({
        where: { nume: numePermisiune }
      })
      if (permisiune) {
        await prisma.rolPermisiune.create({
          data: {
            rolId: '550e8400-e29b-41d4-a716-446655440004',
            permisiuneId: permisiune.id
          }
        })
      }
    }

    // Cititor
    const permisiuniCititor = ['documente_citire', 'rapoarte_vizualizare']
    for (const numePermisiune of permisiuniCititor) {
      const permisiune = await prisma.permisiune.findUnique({
        where: { nume: numePermisiune }
      })
      if (permisiune) {
        await prisma.rolPermisiune.create({
          data: {
            rolId: '550e8400-e29b-41d4-a716-446655440005',
            permisiuneId: permisiune.id
          }
        })
      }
    }

    console.log('🔗 Relații rol-permisiuni create')

    // 6. Creează utilizatori de test
    const parolaHash = await bcrypt.hash('parola123', 10)

    // Super Admin
    const superAdmin = await prisma.utilizator.create({
      data: {
        id: '350e8400-e29b-41d4-a716-446655440001',
        email: 'admin@sector1.ro',
        parolaHash,
        nume: 'Popescu',
        prenume: 'Ion',
        functie: 'Administrator Sistem',
        telefon: '0721.555.001',
        primariaId: primariaTest.id,
        emailVerificat: true
      }
    })

    // Administrator Primărie
    const adminPrimarie = await prisma.utilizator.create({
      data: {
        id: '350e8400-e29b-41d4-a716-446655440002',
        email: 'manager@sector1.ro',
        parolaHash,
        nume: 'Ionescu',
        prenume: 'Maria',
        functie: 'Manager Primărie',
        telefon: '0721.555.002',
        primariaId: primariaTest.id,
        emailVerificat: true
      }
    })

    // Operator Registratură
    const operatorRegistratura = await prisma.utilizator.create({
      data: {
        id: '350e8400-e29b-41d4-a716-446655440003',
        email: 'operator@sector1.ro',
        parolaHash,
        nume: 'Georgescu',
        prenume: 'Ana',
        functie: 'Operator Registratură',
        telefon: '0721.555.003',
        primariaId: primariaTest.id,
        emailVerificat: true
      }
    })

    console.log('👤 Utilizatori de test creați')

    // 7. Atribuie roluri utilizatorilor
    await prisma.utilizatorRol.create({
      data: {
        utilizatorId: superAdmin.id,
        rolId: '550e8400-e29b-41d4-a716-446655440001' // Super Admin
      }
    })

    await prisma.utilizatorRol.create({
      data: {
        utilizatorId: adminPrimarie.id,
        rolId: '550e8400-e29b-41d4-a716-446655440002' // Administrator
      }
    })

    await prisma.utilizatorRol.create({
      data: {
        utilizatorId: operatorRegistratura.id,
        rolId: '550e8400-e29b-41d4-a716-446655440003' // Operator Registratură
      }
    })

    console.log('🔗 Roluri atribuite utilizatorilor')

    // 8. Creează categoriile de documente
    for (const categorie of CATEGORII_DOCUMENTE_INITIALE) {
      await prisma.categorieDocument.create({
        data: categorie
      })
    }
    console.log('📁 Categorii documente create')

    console.log('\n✅ Seed complet cu succes!')
    console.log('\n📋 Utilizatori de test creați:')
    console.log('1. Super Admin: admin@sector1.ro / parola123')
    console.log('2. Administrator: manager@sector1.ro / parola123')
    console.log('3. Operator: operator@sector1.ro / parola123')
    
  } catch (error) {
    console.error('❌ Eroare în timpul seed-ului:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
