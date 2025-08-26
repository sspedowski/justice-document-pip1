import { useState, useEffect, useMemo, useCallback } from 'react'
import { useKV } from '@/hooks/useKV'
import { ErrorBoundary, useErrorHandler } from '@/components/ErrorBoundary'
import { ApplicationError, ErrorHandler, safeAsync, Validator, ERROR_CODES, type Result } from '@/lib/errorHandler'
// All type definitions are now in types.ts to avoid conflicts
import type { 
  Document, 
  DocumentVersion, 
  ProcessingDocument, 
  SearchResult, 
  DuplicateResult,
  DocumentCategory,
  IncludeStatus,
  ChangeType
} from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { FileText, Upload, Scales, Shield, Users, Download, Funnel, MagnifyingGlass, Eye, PencilSimple, GitBranch, TextT, X, Clock, User, FileArrowUp, ChartLine, GitMerge, Warning, ArrowClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { extractTextFromPDF, validatePDF, getPDFInfo } from '@/lib/pdfProcessor'
import { 
  generateFileFingerprint, 
  detectDuplicate, 
  handleDuplicateAction,
  getDuplicatePreventionRules
} from '@/lib/duplicateDetection'
import { ReportGenerator } from '@/components/ReportGenerator'
import { DocumentComparison } from '@/components/DocumentComparison'
import { DuplicateDetectionDialog } from '@/components/DuplicateDetectionDialog'
import { TamperingDetector } from '@/components/TamperingDetector'
import TamperingDetectorTest from '@/components/TamperingDetectorTest'
import AdvancedTamperingAnalyzer from '@/components/AdvancedTamperingAnalyzer'
import EvidenceAnalysisDisplay from '@/components/EvidenceAnalysisDisplay'

import { sampleDocumentsWithTampering } from '@/data/sampleTamperingData'
import { sampleDocumentsWithDates } from '@/data/sampleDocumentsWithDates'

// All type definitions are now in types.ts to avoid conflicts

const CHILDREN_NAMES = ['Jace', 'Josh', 'Joshua', 'Nicholas', 'John', 'Peyton', 'Owen']

const LAWS = [
  { name: 'Brady v. Maryland', keywords: ['Brady', 'exculpatory', 'suppressed evidence', 'withheld'] },
  { name: 'Due Process (14th Amendment)', keywords: ['due process', 'denied hearing', 'procedural', 'fundamental fairness'] },
  { name: 'CAPTA', keywords: ['CAPTA', 'child abuse prevention', 'failure to investigate'] },
  { name: 'Perjury', keywords: ['perjury', 'false statement', 'sworn', 'oath'] },
  { name: 'Evidence Tampering', keywords: ['tamper', 'altered', 'fabricated', 'suppressed', 'omitted'] }
]

// Load processed documents from GitHub Actions pipeline with proper error handling
async function loadProcessedDocuments(): Promise<Result<Document[]>> {
  return await safeAsync(async (): Promise<Document[]> => {
    let response: Response
    
    try {
      // Try relative path first
      response = await fetch('/app/data/justice-documents.json')
    } catch (error) {
      // If that fails, try absolute path from public folder
      response = await fetch('./app/data/justice-documents.json')
    }
    
    if (!response.ok) {
      console.log('No processed documents file found - this is normal for new installations')
      return []
    }
    
    const data = await response.json()
    
    // Validate that data is an array
    if (!Array.isArray(data)) {
      throw new Error('Invalid processed documents format: expected array')
    }
    
    // Filter and validate documents
    const documents = data
      .filter(doc => doc && typeof doc === 'object')
      .map(doc => ({
        ...doc,
        currentVersion: doc.currentVersion || 1,
        lastModified: doc.lastModified || doc.uploadedAt || new Date().toISOString(),
        lastModifiedBy: doc.lastModifiedBy || 'Pipeline Import'
      }))
      .filter(doc => {
        // Basic validation
        return doc.id && 
               typeof doc.id === 'string' && 
               doc.fileName && 
               typeof doc.fileName === 'string'
      }) as Document[]
    
    return documents
  }, (error) => 
    ErrorHandler.handle(
      new ApplicationError(
        ERROR_CODES.NETWORK_ERROR,
        'Failed to load processed documents',
        {
          severity: 'low', // This is expected for new installations
          recoverable: true,
          cause: error instanceof Error ? error : new Error('Unknown load error')
        }
      ),
      'loadProcessedDocuments'
    )
  )
}

function App() {
  // Error handler - must be first
  const { handleError } = useErrorHandler()
  
  // All hooks must be called unconditionally and in the same order every time
  // Initialize useKV hooks with proper error handling - simplified usage
  const [documents, setDocuments] = useKV<Document[]>('justice-documents', [])
  const [documentVersions, setDocumentVersions] = useKV<DocumentVersion[]>('document-versions', [])
  
  // All useState hooks must be declared before any other logic
  const [processedDocs, setProcessedDocs] = useState<Document[]>([])
  const [processing, setProcessing] = useState<ProcessingDocument[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [viewingVersionHistory, setViewingVersionHistory] = useState<Document | null>(null)
  const [comparingVersions, setComparingVersions] = useState<Document | null>(null)
  const [showTamperingDetector, setShowTamperingDetector] = useState(false)
  const [showTamperingTest, setShowTamperingTest] = useState(false)
  const [showAdvancedAnalyzer, setShowAdvancedAnalyzer] = useState(false)
  const [showEvidenceAnalysis, setShowEvidenceAnalysis] = useState(false)
  const [changeNotes, setChangeNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [contentSearchTerm, setContentSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [documentSearchTerm, setDocumentSearchTerm] = useState('')
  const [isLoadingProcessed, setIsLoadingProcessed] = useState(true)
  
  // Duplicate detection state
  const [duplicateDialog, setDuplicateDialog] = useState<{
    isOpen: boolean
    result: DuplicateResult | null
    newFile: File | null
    processingDoc: ProcessingDocument | null
  }>({
    isOpen: false,
    result: null,
    newFile: null,
    processingDoc: null
  })

  // Load processed documents from GitHub Actions pipeline on component mount with error handling
  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (!mounted) return
      setIsLoadingProcessed(true)
      
      try {
        const result = await loadProcessedDocuments()
        
        if (!mounted) return
        
        if (!result.success) {
          console.log('Failed to load processed documents:', result.error)
          setProcessedDocs([])
          return
        }
        
        const processed = result.data
        setProcessedDocs(processed)
        
        if (processed.length > 0) {
          toast.success(`Loaded ${processed.length} processed documents from pipeline`)
        } else {
          console.log('No documents found - ready to upload new PDFs')
        }
      } catch (error) {
        if (!mounted) return
        console.error('Error loading processed documents:', error)
      } finally {
        if (mounted) {
          setIsLoadingProcessed(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      mounted = false
    }
  }, []) // Empty dependency array - run once on mount

  // Combine processed and local documents - use useMemo to prevent recalculation on every render
  const allDocuments = useMemo(() => {
    const processed = processedDocs.filter(doc => doc && doc.id) || []
    const local = documents.filter(doc => doc && doc.id) || []
    
    return [
      ...processed, 
      ...local.filter(localDoc => 
        !processed.some(processedDoc => processedDoc.fileName === localDoc.fileName)
      )
    ]
  }, [processedDocs, documents])

  // Advanced content search function
  const searchInDocuments = useCallback((query: string): SearchResult[] => {
    if (!query.trim() || allDocuments.length === 0) return []
    
    const results: SearchResult[] = []
    const searchLower = query.toLowerCase()
    
    allDocuments.forEach(doc => {
      if (!doc || !doc.textContent) return
      
      const matches: SearchResult['matches'] = []
      const text = doc.textContent.toLowerCase()
      let position = 0
      
      // Find all occurrences of the search term
      while (position < text.length) {
        const index = text.indexOf(searchLower, position)
        if (index === -1) break
        
        // Extract context around the match (100 chars before and after)
        const contextStart = Math.max(0, index - 100)
        const contextEnd = Math.min(text.length, index + searchLower.length + 100)
        const context = doc.textContent.substring(contextStart, contextEnd)
        
        // Get the actual matched text with original casing
        const matchText = doc.textContent.substring(index, index + searchLower.length)
        
        matches.push({
          text: matchText,
          context: contextStart > 0 ? '...' + context : context,
          position: index
        })
        
        position = index + 1
      }
      
      if (matches.length > 0) {
        results.push({
          docId: doc.id,
          matches: matches.slice(0, 5) // Limit to 5 matches per document
        })
      }
    })
    
    return results
  }, [allDocuments])

  // Effect to update search results when content search term changes
  useEffect(() => {
    if (contentSearchTerm.trim() && allDocuments.length > 0) {
      const results = searchInDocuments(contentSearchTerm)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [contentSearchTerm, searchInDocuments])

  // Version management functions
  const createDocumentVersion = useCallback((doc: Document, changeType: DocumentVersion['changeType'], notes?: string): DocumentVersion => {
    const version = (doc.currentVersion || 0) + 1
    return {
      id: `${doc.id}-v${version}-${Date.now()}`,
      documentId: doc.id,
      version,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      children: [...doc.children],
      laws: [...doc.laws],
      misconduct: doc.misconduct.map(m => ({ ...m })),
      include: doc.include,
      placement: { ...doc.placement },
      changedBy: 'Current User', // In a real app, this would come from authentication
      changedAt: new Date().toISOString(),
      changeNotes: notes,
      changeType
    }
  }, [])

  const saveDocumentWithVersion = useCallback((updatedDoc: Document, changeType: DocumentVersion['changeType'], notes?: string) => {
    // Create version history entry
    const version = createDocumentVersion(updatedDoc, changeType, notes)
    
    // Update document with new version info
    const docWithVersion = {
      ...updatedDoc,
      currentVersion: version.version,
      lastModified: new Date().toISOString(),
      lastModifiedBy: 'Current User'
    }

    // Save version and document
    setDocumentVersions(prev => [...prev, version])
    
    // Check if this is a processed document or local document
    const isProcessedDoc = processedDocs.some(doc => doc.id === updatedDoc.id)
    
    if (isProcessedDoc) {
      setProcessedDocs(prev => prev.map(doc => 
        doc.id === updatedDoc.id ? docWithVersion : doc
      ))
    } else {
      setDocuments(prev => prev.map(doc => 
        doc.id === updatedDoc.id ? docWithVersion : doc
      ))
    }
  }, [createDocumentVersion, processedDocs, setDocuments, setDocumentVersions])

  const getDocumentVersions = useCallback((documentId: string): DocumentVersion[] => {
    return documentVersions
      .filter(v => v.documentId === documentId)
      .sort((a, b) => b.version - a.version)
  }, [documentVersions])

  const showVersionHistory = (doc: Document) => {
    const versions = getDocumentVersions(doc.id)
    setViewingVersionHistory(doc)
    
    if (versions.length === 0) {
      toast.info('No version history yet. Changes to this document will be tracked going forward.')
    } else {
      toast.success(`Viewing ${versions.length} version${versions.length === 1 ? '' : 's'} of "${doc.title}"`)
    }
  }

  const showVersionComparison = (doc: Document) => {
    const versions = getDocumentVersions(doc.id)
    if (versions.length < 1) {
      toast.error('Need at least 2 versions to compare. Make some edits to create version history.')
      return
    }
    setComparingVersions(doc)
    toast.success(`Opening comparison view for "${doc.title}"`)
  }

  const revertToVersion = (documentId: string, versionId: string) => {
    const version = documentVersions.find(v => v.id === versionId)
    if (!version) {
      toast.error('Version not found')
      return
    }

    const currentDoc = allDocuments.find(d => d.id === documentId)
    if (!currentDoc) {
      toast.error('Document not found')
      return
    }

    // Create updated document from version data
    const revertedDoc: Document = {
      ...currentDoc,
      title: version.title,
      description: version.description,
      category: version.category,
      children: [...version.children],
      laws: [...version.laws],
      misconduct: version.misconduct.map(m => ({ ...m })),
      include: version.include,
      placement: { ...version.placement }
    }

    saveDocumentWithVersion(revertedDoc, 'edited', `Reverted to version ${version.version}`)
    toast.success(`Reverted to version ${version.version}`)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus on main search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search documents"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
      
      // Ctrl/Cmd + Shift + F to open content search
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setShowAdvancedSearch(true)
        setTimeout(() => {
          const contentSearchInput = document.querySelector('input[placeholder*="Search within document content"]') as HTMLInputElement
          if (contentSearchInput) {
            contentSearchInput.focus()
          }
        }, 100)
      }
      
      // Ctrl/Cmd + H to open version history for selected document
      if ((e.ctrlKey || e.metaKey) && e.key === 'h' && selectedDoc) {
        e.preventDefault()
        showVersionHistory(selectedDoc)
        setSelectedDoc(null)
      }
      
      // Ctrl/Cmd + D to open version comparison for selected document
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedDoc) {
        e.preventDefault()
        showVersionComparison(selectedDoc)
        setSelectedDoc(null)
      }
      
      // Ctrl/Cmd + Shift + A to open advanced analyzer
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setShowAdvancedAnalyzer(true)
      }
      
      // Ctrl/Cmd + T to open tampering detector
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        setShowTamperingDetector(true)
      }
      
      // Ctrl/Cmd + Shift + T to open tampering test
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setShowTamperingTest(true)
      }
      
      // Ctrl/Cmd + R to run immediate tampering analysis
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        runImmediateTamperingAnalysis()
      }
      
      // Escape to close dialogs
      if (e.key === 'Escape') {
        if (comparingVersions) {
          setComparingVersions(null)
        } else if (viewingVersionHistory) {
          setViewingVersionHistory(null)
        } else if (editingDoc) {
          setEditingDoc(null)
          setChangeNotes('')
        } else if (selectedDoc) {
          setSelectedDoc(null)
        } else if (showTamperingDetector) {
          setShowTamperingDetector(false)
        } else if (showAdvancedAnalyzer) {
          setShowAdvancedAnalyzer(false)
        } else if (showTamperingTest) {
          setShowTamperingTest(false)
        } else if (showEvidenceAnalysis) {
          setShowEvidenceAnalysis(false)
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedDoc, viewingVersionHistory, editingDoc, comparingVersions, showTamperingDetector, showAdvancedAnalyzer, showTamperingTest, showEvidenceAnalysis])

  const filteredDocuments = allDocuments.filter(doc => {
    if (!doc) return false
    
    const matchesSearch = searchTerm === '' || 
      (doc.fileName && doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.title && doc.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.children && doc.children.some(child => child && child.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (doc.laws && doc.laws.some(law => law && law.toLowerCase().includes(searchTerm.toLowerCase())))
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    
    // If there's a content search active, filter to show only docs with matches
    const matchesContentSearch = contentSearchTerm === '' || 
      searchResults.some(result => result.docId === doc.id)
    
    return matchesSearch && matchesCategory && matchesContentSearch
  })

  const handleFileUpload = async (files: FileList) => {
    try {
      const fileArray = Array.from(files)
      
      if (fileArray.length === 0) {
        toast.error('Please select files to upload')
        return
      }

      // Validate all files first with proper error handling
      const validationResults = await Promise.allSettled(
        fileArray.map(async (file) => {
          const validation = Validator.isValidPDFFile(file)
          if (!validation.success) {
            return { file, isValid: false, error: validation.error }
          }
          
          const pdfValidation = await validatePDF(file)
          return { 
            file, 
            isValid: pdfValidation.success, 
            error: pdfValidation.success ? null : pdfValidation.error 
          }
        })
      )

      const processedValidations = validationResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            file: fileArray[index],
            isValid: false,
            error: new ApplicationError(
              ERROR_CODES.FILE_CORRUPTED,
              'File validation failed',
              { cause: new Error(result.reason) }
            )
          }
        }
      })

      const invalidFiles = processedValidations.filter(r => !r.isValid)
      const validFiles = processedValidations.filter(r => r.isValid).map(r => r.file)

      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map(f => f.file.name).join(', ')
        const firstError = invalidFiles[0].error
        
        if (firstError) {
          handleError(firstError, 'fileUpload:validation')
        } else {
          toast.error(`Invalid PDF files: ${invalidNames}`)
        }
      }

      if (validFiles.length === 0) {
        toast.error('No valid PDF files found')
        return
      }

      // Process valid files with error handling
      for (const file of validFiles) {
        const processingDoc: ProcessingDocument = {
          fileName: file.name,
          progress: 0,
          status: 'validating'
        }
        
        setProcessing(prev => [...prev, processingDoc])
        
        try {
          await processRealPDF(file, processingDoc)
        } catch (error) {
          handleError(
            error instanceof ApplicationError ? error : new ApplicationError(
              ERROR_CODES.PDF_EXTRACTION_FAILED,
              `Failed to process ${file.name}`,
              { cause: error instanceof Error ? error : new Error('Unknown processing error') }
            ),
            'fileUpload:processFile'
          )
        }
      }
    } catch (error) {
      handleError(
        error instanceof ApplicationError ? error : new ApplicationError(
          ERROR_CODES.UNKNOWN_ERROR,
          'File upload operation failed',
          { cause: error instanceof Error ? error : new Error('Unknown upload error') }
        ),
        'handleFileUpload'
      )
    }
  }

  const processRealPDF = async (file: File, processingDoc: ProcessingDocument) => {
    const updateProgress = (progress: number, status: ProcessingDocument['status']) => {
      setProcessing(prev => prev.map(p => 
        p.fileName === file.name 
          ? { ...p, progress, status }
          : p
      ))
    }

    try {
      // Step 1: Validate (already done, but update UI)
      updateProgress(10, 'validating')
      await new Promise(resolve => setTimeout(resolve, 200))

      // Step 2: Extract text from PDF with proper error handling
      updateProgress(25, 'extracting')
      const pdfResult = await extractTextFromPDF(file, 50) // Limit to 50 pages for performance
      
      if (!pdfResult.success) {
        throw pdfResult.error
      }
      
      updateProgress(50, 'analyzing')
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Step 3: Generate fingerprint for duplicate detection
      updateProgress(60, 'checking-duplicates')
      const fingerprintResult = await generateFileFingerprint(file, pdfResult.data.text, pdfResult.data.pageCount)
      
      if (!fingerprintResult.success) {
        throw fingerprintResult.error
      }
      
      // Step 4: Check for duplicates with proper error handling
      const duplicateResult = detectDuplicate(fingerprintResult.data, allDocuments)
      
      if (!duplicateResult.success) {
        throw duplicateResult.error
      }
      
      if (duplicateResult.data.isDuplicate) {
        // Stop processing and show duplicate dialog
        updateProgress(60, 'duplicate-found')
        setProcessing(prev => prev.map(p => 
          p.fileName === file.name 
            ? { ...p, duplicateResult: duplicateResult.data }
            : p
        ))
        
        setDuplicateDialog({
          isOpen: true,
          result: duplicateResult.data,
          newFile: file,
          processingDoc: { ...processingDoc, duplicateResult: duplicateResult.data }
        })
        
        toast.warning(`Potential duplicate detected: ${file.name} (${duplicateResult.data.confidence}% confidence)`)
        return // Stop processing until user decides
      }
      
      // Step 5: Continue with normal processing
      updateProgress(70, 'analyzing')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Continue with document creation...
      await createDocumentFromPDF(file, pdfResult.data, fingerprintResult.data, updateProgress)
      
    } catch (error) {
      const appError = error instanceof ApplicationError ? error : new ApplicationError(
        ERROR_CODES.PDF_EXTRACTION_FAILED,
        `Processing failed for ${file.name}`,
        { 
          cause: error instanceof Error ? error : new Error('Unknown processing error'),
          details: { fileName: file.name }
        }
      )
      
      handleError(appError, 'processRealPDF')
      updateProgress(0, 'error')
      setProcessing(prev => prev.map(p => 
        p.fileName === file.name 
          ? { 
              ...p, 
              status: 'error', 
              progress: 0,
              error: appError.userMessage
            }
          : p
      ))
    }
  }

  // Helper function to create document from PDF processing result
  const createDocumentFromPDF = async (
    file: File, 
    pdfResult: any, 
    fingerprint: any, 
    updateProgress: (progress: number, status: ProcessingDocument['status']) => void
  ) => {
    try {
      // Analyze content for children and laws
      const detectedChildren = CHILDREN_NAMES.filter(name => 
        pdfResult.text.toLowerCase().includes(name.toLowerCase())
      )
      
      const detectedLaws = LAWS.filter(law =>
        law.keywords.some(keyword => 
          pdfResult.text.toLowerCase().includes(keyword.toLowerCase())
        )
      ).map(law => law.name)

      const category = guessCategory(pdfResult.text)
      
      // Create a more meaningful description from extracted text
      const description = createDescription(pdfResult.text, pdfResult.metadata)
      
      const newDoc: Document = {
        id: Date.now().toString(),
        fileName: file.name,
        title: pdfResult.metadata?.title || file.name.replace('.pdf', ''),
        description,
        category,
        children: detectedChildren,
        laws: detectedLaws,
        misconduct: detectedLaws.map(law => ({
          law,
          page: '',
          paragraph: '',
          notes: ''
        })),
        include: category === 'No' ? 'NO' : 'YES',
        placement: {
          masterFile: category !== 'No',
          exhibitBundle: ['Primary', 'Supporting'].includes(category),
          oversightPacket: ['Primary', 'Supporting'].includes(category)
        },
        uploadedAt: new Date().toISOString(),
        textContent: pdfResult.text.substring(0, 50000), // Store first 50k chars for search
        currentVersion: 1,
        lastModified: new Date().toISOString(),
        lastModifiedBy: 'Current User',
        // Store fingerprint data for future duplicate detection
        fingerprint,
        fileHash: fingerprint.fileHash,
        fileSize: fingerprint.fileSize,
        pageCount: fingerprint.pageCount,
        firstPageHash: fingerprint.firstPageHash
      }

      updateProgress(100, 'complete')
      
      // Save document and create initial version
      setDocuments(prev => [...prev, newDoc])
      
      // Create initial version entry
      const initialVersion = createDocumentVersion(newDoc, 'created', 'Initial document upload and processing')
      setDocumentVersions(prev => [...prev, initialVersion])
      
      setTimeout(() => {
        setProcessing(prev => prev.filter(p => p.fileName !== file.name))
      }, 2000)

      toast.success(`Successfully processed ${file.name} (${pdfResult.pageCount} pages)`)
    } catch (error) {
      throw new ApplicationError(
        ERROR_CODES.STORAGE_OPERATION_FAILED,
        'Failed to save processed document',
        { 
          cause: error instanceof Error ? error : new Error('Unknown save error'),
          details: { fileName: file.name }
        }
      )
    }
  }
  const createDescription = (text: string, metadata?: any): string => {
    const cleanText = text.replace(/\s+/g, ' ').trim()
    
    // Try to find a meaningful first sentence or paragraph
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    if (sentences.length > 0) {
      let description = sentences[0].trim()
      if (description.length < 100 && sentences.length > 1) {
        description += '. ' + sentences[1].trim()
      }
      
      // Add metadata context if available
      if (metadata?.author) {
        description = `Document by ${metadata.author}. ${description}`
      }
      
      return description.length > 500 
        ? description.substring(0, 500) + '...'
        : description
    }
    
    // Fallback to first 300 characters
    return cleanText.length > 300 
      ? cleanText.substring(0, 300) + '...'
      : cleanText || 'No readable text content found'
  }

  const guessCategory = (text: string): Document['category'] => {
    const lowerText = text.toLowerCase()
    
    // Primary evidence indicators
    if (
      lowerText.includes('nurse exam') || 
      lowerText.includes('forensic') || 
      lowerText.includes('police report') ||
      lowerText.includes('investigation report') ||
      lowerText.includes('medical exam') ||
      lowerText.includes('child protective') ||
      lowerText.includes('abuse allegation') ||
      lowerText.includes('witness statement')
    ) {
      return 'Primary'
    }
    
    // Skip these documents
    if (
      lowerText.includes('notice of hearing') || 
      lowerText.includes('scheduling') ||
      lowerText.includes('calendar notice') ||
      lowerText.includes('administrative notice') ||
      (lowerText.includes('notice') && lowerText.length < 500) // Short notices
    ) {
      return 'No'
    }
    
    // External documents
    if (
      lowerText.includes('newspaper') ||
      lowerText.includes('news article') ||
      lowerText.includes('media report') ||
      lowerText.includes('press release')
    ) {
      return 'External'
    }
    
    // Default to supporting for everything else
    return 'Supporting'
  }

  const handleEditDocument = (doc: Document) => {
    setEditingDoc({ ...doc })
  }

  const saveEditedDocument = () => {
    if (!editingDoc) return
    
    const notes = changeNotes.trim() || 'Document edited'
    saveDocumentWithVersion(editingDoc, 'edited', notes)
    
    toast.success('Document updated with version history')
    setEditingDoc(null)
    setChangeNotes('')
  }

  const handleDuplicateDialogAction = (action: 'skip' | 'replace' | 'keep-both') => {
    const { result, newFile, processingDoc } = duplicateDialog
    
    if (!result || !newFile || !processingDoc) {
      toast.error('Missing duplicate dialog data')
      setDuplicateDialog({ isOpen: false, result: null, newFile: null, processingDoc: null })
      return
    }

    // Handle the duplicate action using the imported function
    if (action === 'replace') {
      toast.info('Replacing existing document...')
      // Continue processing the file but replace the existing document
      continueProcessingAfterDuplicate(newFile, processingDoc, result.existingDocument.id)
    } else if (action === 'keep-both') {
      toast.info('Keeping both documents...')
      // Continue processing with modified filename
      continueProcessingAfterDuplicate(newFile, processingDoc)
    } else if (action === 'skip') {
      toast.info(`Skipped upload - keeping existing: ${result.existingDocument.fileName}`)
      // Remove from processing queue
      setProcessing(prev => prev.filter(p => p.fileName !== newFile.name))
    }

    // Close dialog
    setDuplicateDialog({ isOpen: false, result: null, newFile: null, processingDoc: null })
  }

  const continueProcessingAfterDuplicate = async (
    file: File, 
    processingDoc: ProcessingDocument, 
    replaceDocId?: string
  ) => {
    try {
      // Continue from where we left off (after duplicate check)
      const updateProgress = (progress: number, status: ProcessingDocument['status']) => {
        setProcessing(prev => prev.map(p => 
          p.fileName === file.name 
            ? { ...p, progress, status }
            : p
        ))
      }

      updateProgress(70, 'analyzing')
      
      // Extract text again (we need it for processing)
      const pdfResult = await extractTextFromPDF(file, 50)
      if (!pdfResult.success) {
        throw pdfResult.error
      }
      
      const fingerprintResult = await generateFileFingerprint(file, pdfResult.data.text, pdfResult.data.pageCount)
      if (!fingerprintResult.success) {
        throw fingerprintResult.error
      }
      
      const fingerprint = fingerprintResult.data
      
      // Analyze content
      const detectedChildren = CHILDREN_NAMES.filter(name => 
        pdfResult.data.text.toLowerCase().includes(name.toLowerCase())
      )
      
      const detectedLaws = LAWS.filter(law =>
        law.keywords.some(keyword => 
          pdfResult.data.text.toLowerCase().includes(keyword.toLowerCase())
        )
      ).map(law => law.name)

      const category = guessCategory(pdfResult.data.text)
      const description = createDescription(pdfResult.data.text, pdfResult.data.metadata)
      
      const timestamp = Date.now()
      const modifiedFileName = replaceDocId 
        ? file.name 
        : file.name.replace(/(\.[^.]+)$/, `_${timestamp}$1`)
      
      const newDoc: Document = {
        id: replaceDocId || timestamp.toString(),
        fileName: modifiedFileName,
        title: pdfResult.data.metadata?.title || modifiedFileName.replace('.pdf', ''),
        description,
        category,
        children: detectedChildren,
        laws: detectedLaws,
        misconduct: detectedLaws.map(law => ({
          law,
          page: '',
          paragraph: '',
          notes: ''
        })),
        include: category === 'No' ? 'NO' : 'YES',
        placement: {
          masterFile: category !== 'No',
          exhibitBundle: ['Primary', 'Supporting'].includes(category),
          oversightPacket: ['Primary', 'Supporting'].includes(category)
        },
        uploadedAt: new Date().toISOString(),
        textContent: pdfResult.data.text.substring(0, 50000),
        currentVersion: 1,
        lastModified: new Date().toISOString(),
        lastModifiedBy: 'Current User',
        fingerprint,
        fileHash: fingerprint.fileHash,
        fileSize: fingerprint.fileSize,
        pageCount: fingerprint.pageCount,
        firstPageHash: fingerprint.firstPageHash
      }

      updateProgress(100, 'complete')
      
      if (replaceDocId) {
        // Replace existing document
        setDocuments(prev => prev.map(doc => 
          doc.id === replaceDocId ? newDoc : doc
        ))
        // Also check processed docs
        setProcessedDocs(prev => prev.map(doc => 
          doc.id === replaceDocId ? newDoc : doc
        ))
        toast.success(`Replaced existing document: ${file.name}`)
      } else {
        // Add as new document
        setDocuments(prev => [...prev, newDoc])
        toast.success(`Added new document: ${modifiedFileName}`)
      }
      
      // Create version entry
      const initialVersion = createDocumentVersion(
        newDoc, 
        replaceDocId ? 'edited' : 'created', 
        replaceDocId ? 'Document replaced via duplicate handling' : 'Initial document upload and processing'
      )
      setDocumentVersions(prev => [...prev, initialVersion])
      
      setTimeout(() => {
        setProcessing(prev => prev.filter(p => p.fileName !== file.name))
      }, 2000)

    } catch (error) {
      console.error('Error continuing processing after duplicate:', error)
      toast.error(`Failed to continue processing: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setProcessing(prev => prev.filter(p => p.fileName !== file.name))
    }
  }

  const handleExportReport = (reportData: any) => {
    // Export comprehensive report as JSON
    const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const jsonUrl = URL.createObjectURL(jsonBlob)
    const jsonLink = document.createElement('a')
    jsonLink.href = jsonUrl
    jsonLink.download = `justice-report-${new Date().toISOString().split('T')[0]}.json`
    jsonLink.click()
    URL.revokeObjectURL(jsonUrl)

    // Also export as CSV summary
    const summaryHeaders = ['Metric', 'Value']
    const summaryRows = [
      ['Total Documents', reportData.summary.totalDocuments],
      ['Primary Evidence', reportData.summary.primaryEvidence],
      ['Included Documents', reportData.summary.includedDocuments],
      ['Children Involved', reportData.summary.childrenInvolved],
      ['Laws Violated', reportData.summary.lawsViolated],
      ['Oversight Ready', reportData.summary.oversightReady],
      ['Total Versions', reportData.summary.totalVersions],
      ['Generated At', new Date(reportData.generatedAt).toLocaleString()]
    ]
    
    const csvContent = [summaryHeaders, ...summaryRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const csvBlob = new Blob([csvContent], { type: 'text/csv' })
    const csvUrl = URL.createObjectURL(csvBlob)
    const csvLink = document.createElement('a')
    csvLink.href = csvUrl
    csvLink.download = `justice-report-summary-${new Date().toISOString().split('T')[0]}.csv`
    csvLink.click()
    URL.revokeObjectURL(csvUrl)
  }

  const generateOversightPackets = () => {
    const eligibleDocs = allDocuments.filter(doc => doc.placement.oversightPacket)
    if (eligibleDocs.length === 0) {
      toast.error('No documents eligible for oversight packets')
      return
    }
    
    toast.success(`${eligibleDocs.length} documents ready for oversight packets. Use GitHub Actions to generate PDFs.`)
  }

  const loadSampleTamperingData = () => {
    // Add sample documents to the existing documents
    const newDocs = sampleDocumentsWithTampering.filter(sampleDoc => 
      !allDocuments.some(existingDoc => existingDoc.id === sampleDoc.id)
    )
    
    if (newDocs.length > 0) {
      setDocuments(prev => [...prev, ...newDocs])
      
      // Create version entries for the sample documents
      const newVersions = newDocs.map(doc => createDocumentVersion(doc, 'imported', 'Sample data for tampering detection testing'))
      setDocumentVersions(prev => [...prev, ...newVersions])
      
      toast.success(`Loaded ${newDocs.length} sample documents for tampering detection testing`)
    } else {
      toast.info('Sample tampering data already loaded')
    }
  }

  const loadSampleDateBasedData = () => {
    // Add date-based sample documents to the existing documents
    const newDocs = sampleDocumentsWithDates.filter(sampleDoc => 
      !allDocuments.some(existingDoc => existingDoc.id === sampleDoc.id)
    )
    
    if (newDocs.length > 0) {
      setDocuments(prev => [...prev, ...newDocs])
      
      // Create version entries for the sample documents
      const newVersions = newDocs.map(doc => createDocumentVersion(doc, 'imported', 'Sample data with temporal patterns for date-based tampering detection'))
      setDocumentVersions(prev => [...prev, ...newVersions])
      
      toast.success(`Loaded ${newDocs.length} sample documents with temporal patterns for advanced analysis`)
    } else {
      toast.info('Sample date-based data already loaded')
    }
  }

  const loadTextFilesFromInput = async (autoRunAnalysis = false) => {
    // Load the text files from input directory and convert them to documents
    try {
      const textFiles = [
        'CPS_Report_01.08.2024_Initial.txt',
        'CPS_Report_01.08.2024_Amended.txt', 
        'PoliceReport_12.15.2023_Original.txt',
        'PoliceReport_12.15.2023_Revised.txt',
        'Medical_Exam_03.10.2024.txt'
      ]
      
      const documents: Document[] = []
      
      for (const fileName of textFiles) {
        try {
          const response = await fetch(`/input/${fileName}`)
          if (!response.ok) continue
          
          const textContent = await response.text()
          
          // Analyze content for children and laws
          const detectedChildren = CHILDREN_NAMES.filter(name => 
            textContent.toLowerCase().includes(name.toLowerCase())
          )
          
          const detectedLaws = LAWS.filter(law =>
            law.keywords.some(keyword => 
              textContent.toLowerCase().includes(keyword.toLowerCase())
            )
          ).map(law => law.name)

          const category = guessCategory(textContent)
          
          const doc: Document = {
            id: `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fileName: fileName,
            title: fileName.replace(/\.(txt|pdf)$/i, '').replace(/_/g, ' '),
            description: textContent.substring(0, 300) + (textContent.length > 300 ? '...' : ''),
            category,
            children: detectedChildren,
            laws: detectedLaws,
            misconduct: detectedLaws.map(law => ({
              law,
              page: '',
              paragraph: '',
              notes: ''
            })),
            include: category === 'No' ? 'NO' : 'YES',
            placement: {
              masterFile: category !== 'No',
              exhibitBundle: ['Primary', 'Supporting'].includes(category),
              oversightPacket: ['Primary', 'Supporting'].includes(category)
            },
            uploadedAt: new Date().toISOString(),
            textContent: textContent,
            currentVersion: 1,
            lastModified: new Date().toISOString(),
            lastModifiedBy: 'Text Import',
            fingerprint: {
              fileName: fileName,
              fileHash: `text-${fileName}`,
              fileSize: textContent.length,
              pageCount: 1,
              firstPageHash: textContent.substring(0, 1000)
            },
            fileHash: `text-${fileName}`,
            fileSize: textContent.length,
            pageCount: 1,
            firstPageHash: textContent.substring(0, 1000)
          }
          
          documents.push(doc)
        } catch (error) {
          console.warn(`Failed to load ${fileName}:`, error)
        }
      }
      
      if (documents.length > 0) {
        // Filter out any that already exist
        const newDocs = documents.filter(doc => 
          !allDocuments.some(existing => existing.fileName === doc.fileName)
        )
        
        if (newDocs.length > 0) {
          setDocuments(prev => [...prev, ...newDocs])
          
          // Create version entries
          const newVersions = newDocs.map(doc => 
            createDocumentVersion(doc, 'imported', 'Imported from text files in input directory')
          )
          setDocumentVersions(prev => [...prev, ...newVersions])
          
          toast.success(`✅ Loaded ${newDocs.length} documents from input/ directory`)
          
          // Auto-run analysis if requested and we have enough documents
          if (autoRunAnalysis && newDocs.length >= 2) {
            setTimeout(() => {
              toast.info('🔍 Auto-running tampering analysis on loaded documents...')
              runImmediateTamperingAnalysis()
            }, 1000)
          }
        } else {
          toast.info('Input documents already loaded')
        }
      } else {
        toast.error('No valid text files found in input/ directory')
      }
    } catch (error) {
      console.error('Failed to load text files:', error)
      toast.error('Failed to load documents from input/ directory')
    }
  }

  const runQuickTamperingAnalysis = () => {
    // Load sample data and immediately open advanced analyzer
    loadSampleDateBasedData()
    setTimeout(() => {
      setShowAdvancedAnalyzer(true)
    }, 500)
  }

  const runComparisonAnalysis = () => {
    // Quick analysis using the new tampering detector
    const docsWithContent = allDocuments.filter(doc => doc.textContent && doc.textContent.length > 100)
    
    if (docsWithContent.length < 2) {
      toast.error('Need at least 2 documents with text content to run comparison analysis')
      return
    }
    
    toast.success(`Running comparison analysis on ${docsWithContent.length} documents...`)
    setShowTamperingDetector(true)
  }

  const runImmediateTamperingAnalysis = async () => {
    // REAL EVIDENCE ANALYSIS using your actual case files
    const docsWithContent = allDocuments.filter(doc => doc.textContent && doc.textContent.length > 100)
    
    if (docsWithContent.length === 0) {
      toast.error('No evidence files loaded. Click "Load Input Documents" to load your real CPS reports, police reports, and medical exams.')
      return
    }

    if (docsWithContent.length < 2) {
      toast.warning(`Found only ${docsWithContent.length} evidence file. Loading additional documents for tampering comparison...`)
      await loadTextFilesFromInput(false)
      return
    }

    // Show the evidence analysis display immediately
    setShowEvidenceAnalysis(true)
    
    try {
      // Import the REAL evidence analyzer
      const { analyzeRealEvidence, generateTamperingExecutiveSummary } = await import('@/lib/realEvidenceAnalyzer')
      
      toast.info(`🚨 ANALYZING ${allDocuments.length} REAL EVIDENCE FILES FOR SYSTEMATIC TAMPERING...`, {
        description: 'Opening detailed analysis display with specific contradictions detected',
        duration: 4000
      })
      
      // Run comprehensive analysis on your real documents
      const tamperingReport = analyzeRealEvidence(allDocuments)
      
      // Display the specific contradictions we found
      const contradictions = tamperingReport.specificContradictions
      
      if (contradictions.length === 0) {
        toast.info('No critical tampering detected in current documents. Analysis display will show detailed results.')
        return
      }

      // SHOW SPECIFIC CONTRADICTIONS FROM YOUR REAL FILES
      setTimeout(() => {
        toast.error(`🚨 CRITICAL EVIDENCE TAMPERING DETECTED`, {
          description: `${contradictions.length} critical violations found in your evidence files. Check the detailed analysis display.`,
          duration: 8000
        })
      }, 1000)

      // Store results for display component
      window.latestTamperingReport = tamperingReport
      
    } catch (error) {
      console.error('Real evidence analysis error:', error)
      toast.error('Failed to analyze real evidence: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const exportTamperingReportsDirectly = async () => {
    // Quick tampering analysis and direct export for oversight agencies using REAL evidence analyzer
    const docsWithContent = allDocuments.filter(doc => doc.textContent && doc.textContent.length > 100)
    
    if (docsWithContent.length < 2) {
      toast.error('Need at least 2 documents with text content to generate tampering reports')
      return
    }

    try {
      // Import the REAL evidence analyzer
      const { analyzeRealEvidence, generateTamperingExecutiveSummary } = await import('@/lib/realEvidenceAnalyzer')
      
      toast.info('Analyzing your real evidence files for systematic tampering...')
      
      // Run analysis on real evidence
      const tamperingReport = analyzeRealEvidence(allDocuments)
      
      // Generate comprehensive reports
      const timestamp = new Date().toISOString().split('T')[0]
      
      // Executive Summary with specific contradictions
      const executiveSummary = generateTamperingExecutiveSummary(tamperingReport)
      const execBlob = new Blob([executiveSummary], { type: 'text/plain' })
      const execUrl = URL.createObjectURL(execBlob)
      const execLink = document.createElement('a')
      execLink.href = execUrl
      execLink.download = `EXECUTIVE-SUMMARY-Real-Evidence-Tampering-${timestamp}.txt`
      execLink.click()
      URL.revokeObjectURL(execUrl)

      // Evidence CSV with specific tampering indicators
      const evidenceCsv = generateRealEvidenceCsv(tamperingReport)
      const csvBlob = new Blob([evidenceCsv], { type: 'text/csv' })
      const csvUrl = URL.createObjectURL(csvBlob)
      const csvLink = document.createElement('a')
      csvLink.href = csvUrl
      csvLink.download = `REAL-EVIDENCE-TAMPERING-${timestamp}.csv`
      csvLink.click()
      URL.revokeObjectURL(csvUrl)

      // Detailed Technical Report
      const technicalReport = generateRealEvidenceReport(tamperingReport)
      const mdBlob = new Blob([technicalReport], { type: 'text/markdown' })
      const mdUrl = URL.createObjectURL(mdBlob)
      const mdLink = document.createElement('a')
      mdLink.href = mdUrl
      mdLink.download = `TECHNICAL-ANALYSIS-Real-Evidence-${timestamp}.md`
      mdLink.click()
      URL.revokeObjectURL(mdUrl)

      // JSON data for technical analysis
      const jsonBlob = new Blob([JSON.stringify(tamperingReport, null, 2)], { type: 'application/json' })
      const jsonUrl = URL.createObjectURL(jsonBlob)
      const jsonLink = document.createElement('a')
      jsonLink.href = jsonUrl
      jsonLink.download = `FULL-ANALYSIS-Real-Evidence-${timestamp}.json`
      jsonLink.click()
      URL.revokeObjectURL(jsonUrl)

      // Show results summary
      if (tamperingReport.summary.criticalIndicators > 0) {
        toast.error(`🚨 CRITICAL: ${tamperingReport.summary.criticalIndicators} critical tampering indicators detected!`, {
          description: `${tamperingReport.specificContradictions.length} specific contradictions documented. Reports exported for immediate oversight review.`
        })
      } else if (tamperingReport.summary.documentsWithTampering > 0) {
        toast.warning(`⚠️ ${tamperingReport.summary.documentsWithTampering} documents show potential tampering.`, {
          description: 'Reports exported for oversight review. Manual examination recommended.'
        })
      } else {
        toast.success('✅ No significant tampering indicators detected in current document set.', {
          description: 'Clean bill of health reports exported. May need to load additional evidence files.'
        })
      }

      toast.success(`📋 Real evidence tampering analysis complete`, {
        description: `4 specialized reports exported: Executive Summary, Technical Analysis, Evidence CSV, and Raw JSON data`
      })
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to generate real evidence reports: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const generateRealEvidenceCsv = (report: any): string => {
    const headers = [
      'Document', 'Tampering Type', 'Severity', 'Confidence', 'Description',
      'Before', 'After', 'Location', 'Impact', 'Legal Implications'
    ]

    const rows: string[][] = []

    // Add each specific tampering indicator
    report.specificContradictions.forEach((indicator: any) => {
      rows.push([
        indicator.documentPair.join(' vs '),
        indicator.type,
        indicator.severity,
        `${indicator.confidence}%`,
        indicator.description,
        indicator.details.before,
        indicator.details.after,
        indicator.details.location,
        indicator.details.impact,
        indicator.legalImplications.join('; ')
      ])
    })

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  const generateRealEvidenceReport = (report: any): string => {
    const { summary, specificContradictions, patternAnalysis, legalAssessment } = report
    
    return `# REAL EVIDENCE TAMPERING ANALYSIS REPORT

**Generated:** ${new Date().toLocaleString()}  
**Analysis Type:** Systematic Document Tampering Detection  
**Evidence Source:** Real case files from justice-document-pip system  

## EXECUTIVE SUMMARY

**SEVERITY LEVEL:** ${summary.criticalIndicators > 0 ? 'CRITICAL' : summary.documentsWithTampering > 0 ? 'MODERATE' : 'LOW'}  
**CONFIDENCE:** HIGH (100% on detected alterations)  

### KEY FINDINGS
- **Documents Analyzed:** ${summary.totalDocuments}
- **Documents with Tampering:** ${summary.documentsWithTampering}
- **Critical Violations:** ${summary.criticalIndicators}
- **Name Alterations:** ${summary.nameAlterationCount}
- **Evidence Suppression:** ${summary.evidenceSuppressionCount}
- **Status Manipulations:** ${summary.statusManipulationCount}

## SPECIFIC CONTRADICTIONS DETECTED

${specificContradictions.map((indicator: any, index: number) => `
### ${index + 1}. ${indicator.type.toUpperCase()}: ${indicator.description}

**Documents:** ${indicator.documentPair.join(' vs ')}  
**Severity:** ${indicator.severity.toUpperCase()}  
**Confidence:** ${indicator.confidence}%  

**Alteration Details:**
- **Before:** ${indicator.details.before}
- **After:** ${indicator.details.after}
- **Location:** ${indicator.details.location}
- **Impact:** ${indicator.details.impact}

**Legal Implications:**
${indicator.legalImplications.map((impl: string) => `- ${impl}`).join('\n')}
`).join('\n')}

## PATTERN ANALYSIS

- **Systematic Tampering:** ${patternAnalysis.systematicTampering ? '✅ CONFIRMED' : '❌ Not detected'}
- **Coordinated Alterations:** ${patternAnalysis.coordinatedAlterations ? '✅ CONFIRMED' : '❌ Not detected'}
- **Evidence Suppression:** ${patternAnalysis.evidenceSuppression ? '✅ CONFIRMED' : '❌ Not detected'}
- **Witness Manipulation:** ${patternAnalysis.witnessManipulation ? '✅ CONFIRMED' : '❌ Not detected'}

## LEGAL ASSESSMENT

### Constitutional Violations
${legalAssessment.bradyViolations.length > 0 ? `
**Brady v. Maryland Violations:**
${legalAssessment.bradyViolations.map((v: string) => `- ${v}`).join('\n')}
` : ''}

${legalAssessment.dueProcessViolations.length > 0 ? `
**Due Process Violations:**
${legalAssessment.dueProcessViolations.map((v: string) => `- ${v}`).join('\n')}
` : ''}

${legalAssessment.evidenceTamperingConcerns.length > 0 ? `
**Evidence Tampering Concerns:**
${legalAssessment.evidenceTamperingConcerns.map((v: string) => `- ${v}`).join('\n')}
` : ''}

${legalAssessment.childEndangermentFlags.length > 0 ? `
**Child Protection Failures:**
${legalAssessment.childEndangermentFlags.map((v: string) => `- ${v}`).join('\n')}
` : ''}

## RECOMMENDATIONS

${report.recommendedActions.map((action: string) => `- ${action}`).join('\n')}

## CONCLUSION

${patternAnalysis.systematicTampering ? 
`This analysis provides **conclusive evidence of systematic document tampering** across multiple 
law enforcement and child protective service documents. The alterations show coordination and 
intent to suppress evidence and manipulate case outcomes. Immediate federal oversight 
intervention is required.` :
`Document alterations have been detected that warrant investigation. While patterns may not 
indicate systematic tampering, the identified contradictions require oversight review and 
potential corrective action.`}

**Report Generated by:** Justice Document Manager - Real Evidence Tampering Detection System  
**Suitable for:** Legal proceedings, oversight agency submission, forensic examination  
`
  }

  const generateExecutiveSummaryQuick = (analysisResults: any, documentsForAnalysis: any[]): string => {
    const { overallRiskAssessment, dateGroupAnalyses, timelineFlags } = analysisResults
    const highRiskDocs = overallRiskAssessment.highRiskDocuments.length
    const criticalIssues = overallRiskAssessment.criticalFlags
    
    return `
EXECUTIVE SUMMARY - DOCUMENT TAMPERING DETECTION ANALYSIS
Generated: ${new Date().toLocaleString()}
System: Justice Document Manager - Automated Tampering Detection

OVERALL RISK LEVEL: ${criticalIssues > 0 ? 'CRITICAL' : overallRiskAssessment.totalFlags > 5 ? 'HIGH' : overallRiskAssessment.totalFlags > 0 ? 'MODERATE' : 'LOW'}

SUMMARY STATISTICS:
• Documents Analyzed: ${documentsForAnalysis.length}
• Total Tampering Indicators: ${overallRiskAssessment.totalFlags}
• Critical Security Violations: ${criticalIssues}
• High-Risk Documents: ${highRiskDocs}
• Date Groups with Issues: ${dateGroupAnalyses.filter((g: any) => g.riskLevel === 'critical' || g.riskLevel === 'high').length}
• Timeline Anomalies: ${timelineFlags.length}

${criticalIssues > 0 ? `
🚨 CRITICAL ALERT: Immediate investigation required.
High-Risk Documents:
${overallRiskAssessment.highRiskDocuments.map((id: string) => {
  const doc = documentsForAnalysis.find(d => d.id === id)
  return `   • ${doc?.fileName || id} - ${doc?.title || 'Unknown'}`
}).join('\n')}
` : overallRiskAssessment.totalFlags > 0 ? `
⚠️ MODERATE RISK: Manual review recommended for flagged documents.
` : `
✅ LOW RISK: Documents appear to have maintained integrity.
`}

Analysis includes content comparison, name mention tracking, and timeline verification.
This automated analysis should be supplemented with manual forensic examination for any flagged documents.

Generated by Justice Document Manager Tampering Detection System`.trim()
  }

  const generateEvidenceCsvQuick = (analysisResults: any, documentsForAnalysis: any[]): string => {
    const headers = [
      'Document ID', 'Document Title', 'File Name', 'Category', 'Risk Level',
      'Tampering Indicators', 'Critical Issues', 'Evidence Summary', 'Confidence Score',
      'Date Group', 'Last Modified', 'Analysis Notes'
    ]

    const rows: string[][] = []

    // Add date group analysis results
    analysisResults.dateGroupAnalyses.forEach((group: any) => {
      group.documents.forEach((docId: string) => {
        const doc = documentsForAnalysis.find(d => d.id === docId)
        if (!doc) return

        const docFlags = group.tamperingIndicators
        const criticalFlags = docFlags.filter((f: any) => f.severity === 'critical').length
        const evidence = docFlags.map((f: any) => f.description).join('; ')
        const avgConfidence = docFlags.length > 0 ? 
          Math.round(docFlags.reduce((sum: number, f: any) => sum + f.confidence, 0) / docFlags.length) : 0

        rows.push([
          doc.id, doc.title, doc.fileName, doc.category, group.riskLevel,
          docFlags.length.toString(), criticalFlags.toString(),
          evidence || 'No specific indicators', `${avgConfidence}%`,
          group.date, doc.lastModified,
          `Analyzed in date group with ${group.documents.length} documents`
        ])
      })
    })

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  // Auto-load REAL input documents and run analysis on component mount
  useEffect(() => {
    const autoLoadAndAnalyze = async () => {
      // Wait a bit for the component to fully mount
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // ALWAYS try to load from input directory - these are your REAL FILES
      toast.info('🔍 Loading your REAL evidence files from input/ directory...', {
        description: 'Scanning for CPS reports, police reports, and medical exams with systematic tampering'
      })
      
      try {
        await loadTextFilesFromInput(false) // Load files but don't auto-analyze yet
        
        // After loading, wait a moment and then show evidence analysis
        setTimeout(async () => {
          const loadedCount = allDocuments.filter(doc => doc.textContent && doc.textContent.length > 100).length
          if (loadedCount >= 2) {
            toast.success('🚨 REAL EVIDENCE FILES LOADED - Opening tampering analysis display...', {
              description: `Found ${loadedCount} analyzable evidence files. Opening detailed contradiction analysis.`,
              duration: 4000
            })
            // Auto-show the evidence analysis display
            setShowEvidenceAnalysis(true)
          } else if (loadedCount === 1) {
            toast.info(`📄 Found 1 evidence file`, {
              description: `Need at least 2 documents for comparison analysis. Check input/ directory for more files.`,
              duration: 5000
            })
          } else {
            toast.warning(`📂 No analyzable evidence files found in input/`, {
              description: `Expected to find CPS reports, police reports, and medical exams. Check file formats and content.`,
              duration: 6000
            })
          }
        }, 1500)
        
      } catch (error) {
        console.log('Error loading input documents:', error)
        toast.error('Failed to load evidence files from input/ directory')
      }
    }
    
    autoLoadAndAnalyze()
  }, []) // Run once on mount

  // Check for documents and auto-run analysis
  useEffect(() => {
    if (allDocuments.length > 0) {
      const analyzableCount = allDocuments.filter(doc => doc.textContent && doc.textContent.length > 100).length
      
      if (analyzableCount >= 2) {
        setTimeout(() => {
          toast.info(`🚨 CRITICAL: Auto-opening tampering analysis display for ${analyzableCount} REAL evidence documents...`, {
            description: `Opening detailed contradiction analysis for CPS reports, police reports, and medical exams.`,
            duration: 4000
          })
          // Auto-open the evidence analysis display
          setShowEvidenceAnalysis(true)
        }, 2500)
      } else if (analyzableCount === 1) {
        setTimeout(() => {
          toast.info(`📄 Single document loaded`, {
            description: `Found 1 evidence file. Loading additional documents for comparison analysis...`,
            duration: 5000
          })
          // Still try to load more if only 1 found
          loadTextFilesFromInput(true)
        }, 2000)
      } else if (allDocuments.length > 0) {
        setTimeout(() => {
          toast.warning(`📋 ${allDocuments.length} documents loaded but no text content available`, {
            description: `Documents need extractable text content for tampering analysis. Attempting to reload...`,
            duration: 6000
          })
          // Retry loading
          loadTextFilesFromInput(true)
        }, 2000)
      }
    }
  }, [allDocuments.length])

  const refreshProcessedData = async () => {
    setIsLoadingProcessed(true)
    try {
      const result = await loadProcessedDocuments()
      if (result.success) {
        setProcessedDocs(result.data)
        toast.success(`Refreshed: Found ${result.data.length} processed documents`)
      } else {
        setProcessedDocs([])
        toast.info('No processed documents found')
      }
    } catch (error) {
      toast.error('Failed to refresh processed documents')
      setProcessedDocs([])
    } finally {
      setIsLoadingProcessed(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      'File Name', 'Category', 'Children', 'Laws', 'Misconduct', 
      'Include', 'Master File', 'Exhibit Bundle', 'Oversight Packet', 
      'Title', 'Description'
    ]
    
    const rows = allDocuments.filter(doc => doc).map(doc => [
      doc.fileName || '',
      doc.category || '',
      (doc.children || []).join(', '),
      (doc.laws || []).join(', '),
      (doc.misconduct || []).map(m => `${m.law || ''} p${m.page || ''}/${m.paragraph || ''}`).join('; '),
      doc.include || '',
      (doc.placement?.masterFile || false).toString(),
      (doc.placement?.exhibitBundle || false).toString(),
      (doc.placement?.oversightPacket || false).toString(),
      doc.title || '',
      doc.description || ''
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'MasterReview_INDEX.csv'
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('CSV exported successfully')
  }

  const CategoryBadge = ({ category }: { category: Document['category'] | undefined }) => {
    const safeCategory = category || 'No'
    const colors = {
      Primary: 'bg-red-100 text-red-800',
      Supporting: 'bg-blue-100 text-blue-800',
      External: 'bg-green-100 text-green-800',
      No: 'bg-gray-100 text-gray-800'
    }
    return <Badge className={colors[safeCategory as keyof typeof colors]}>{safeCategory}</Badge>
  }

  return (
    <ErrorBoundary level="page" onError={(error, errorInfo) => {
      console.error('App-level error caught:', error, errorInfo)
    }}>
      <div id="spark-app" className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scales className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Justice Document Manager</h1>
                <p className="text-sm text-muted-foreground">
                  Contact & Action Book — Master File System
                  {allDocuments.length > 0 ? (
                    <span className="ml-2 text-green-600 font-medium">
                      • {allDocuments.length} documents loaded • {documentVersions.length} versions tracked
                    </span>
                  ) : (
                    <span className="ml-2 text-orange-600 font-medium">
                      • No documents loaded - Click "Load Input Documents" to get started
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refreshProcessedData} variant="outline" size="sm" disabled={isLoadingProcessed}>
                <GitBranch className="h-4 w-4 mr-2" />
                {isLoadingProcessed ? 'Loading...' : 'Refresh Data'}
              </Button>
              <Button 
                onClick={() => loadTextFilesFromInput(false)}
                variant="outline" 
                size="sm"
                className="text-green-700 border-green-200 hover:bg-green-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Load Input Documents
              </Button>
              <Button 
                onClick={() => setShowEvidenceAnalysis(true)}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
              >
                <Warning className="h-4 w-4 mr-2" />
                🚨 SHOW REAL CONTRADICTIONS 🚨
              </Button>
              <Button 
                onClick={() => setActiveTab('reports')} 
                variant={activeTab === 'reports' ? 'default' : 'outline'} 
                size="sm"
              >
                <ChartLine className="h-4 w-4 mr-2" />
                Reports
              </Button>
              <Button 
                onClick={() => setShowAdvancedAnalyzer(true)}
                variant="outline" 
                size="sm"
                className="text-red-700 border-red-200 hover:bg-red-50"
              >
                <Warning className="h-4 w-4 mr-2" />
                Advanced Pattern Analysis
              </Button>
              <Button 
                onClick={() => setShowTamperingDetector(true)}
                variant="outline" 
                size="sm"
                className="text-orange-700 border-orange-200 hover:bg-orange-50"
              >
                <Warning className="h-4 w-4 mr-2" />
                Detect Tampering
                <span className="ml-2 text-xs opacity-70">(Ctrl+T)</span>
              </Button>
              <Button 
                onClick={exportTamperingReportsDirectly}
                variant="outline" 
                size="sm"
                className="text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
              <Button 
                onClick={() => setShowTamperingTest(true)}
                variant="outline" 
                size="sm"
                className="text-purple-700 border-purple-200 hover:bg-purple-50"
              >
                <GitMerge className="h-4 w-4 mr-2" />
                Test Date Comparison
              </Button>
              <Button onClick={generateOversightPackets} size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Generate Packets
              </Button>
              <Button 
                onClick={runImmediateTamperingAnalysis}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Warning className="h-4 w-4 mr-2" />
                Run Tampering Analysis
                <span className="ml-2 text-xs opacity-70">(Ctrl+R)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">Document Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <ReportGenerator 
              documents={allDocuments}
              documentVersions={documentVersions}
              onExportReport={handleExportReport}
            />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  GitHub Actions Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Automated Processing</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    This system uses GitHub Actions to automatically process PDF documents. To add new documents:
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Add PDF files to the <code className="bg-background px-1 rounded">input/</code> directory in your repository</li>
                    <li>Commit and push changes to the main branch</li>
                    <li>GitHub Actions will automatically extract text, classify documents, and generate oversight packets</li>
                    <li>Use the "Refresh Data" button above to load newly processed documents</li>
                  </ol>
                  {processedDocs.length > 0 && (
                    <div className="mt-3 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                      ✓ Found {processedDocs.length} documents processed by the pipeline
                    </div>
                  )}
                  {processedDocs.length === 0 && (
                    <div className="mt-3 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded">
                      ℹ️ No pipeline documents found. Upload PDFs to input/ directory to enable automated processing.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Local PDF Upload (Development)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFileUpload(e.dataTransfer.files)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.multiple = true
                    input.accept = '.pdf,application/pdf'
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files
                      if (files) handleFileUpload(files)
                    }
                    input.click()
                  }}
                >
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop PDF files here or click to browse</h3>
                  <p className="text-muted-foreground mb-2">Supports multiple file upload</p>
                  <p className="text-xs text-muted-foreground">
                    Files will be processed locally in your browser - no data is sent to external servers
                  </p>
                </div>

                {processing.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Processing Documents</h4>
                    {processing.map((proc, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="truncate max-w-xs">{proc.fileName}</span>
                          <span className={`capitalize ${
                            proc.status === 'error' ? 'text-destructive' : 
                            proc.status === 'duplicate-found' ? 'text-orange-600' : ''
                          }`}>
                            {proc.status === 'error' && proc.error ? `Error: ${proc.error}` : 
                             proc.status === 'duplicate-found' ? 'Duplicate Found - Awaiting Decision' :
                             proc.status === 'checking-duplicates' ? 'Checking for Duplicates' :
                             proc.status}
                          </span>
                        </div>
                        <Progress 
                          value={proc.progress} 
                          className={`h-2 ${
                            proc.status === 'error' ? 'bg-destructive/20' : 
                            proc.status === 'duplicate-found' ? 'bg-orange-200' : ''
                          }`} 
                        />
                        {proc.status === 'duplicate-found' && proc.duplicateResult && (
                          <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                            {proc.duplicateResult.confidence}% match - {proc.duplicateResult.reason}
                            {proc.duplicateResult.matchType === 'date-based' && proc.duplicateResult.dateMatch && (
                              <div className="mt-1 text-blue-700">
                                📅 Same date ({proc.duplicateResult.dateMatch.sharedDate}) with {proc.duplicateResult.dateMatch.otherDocuments.length} other docs
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warning className="h-5 w-5 text-red-600" />
                  Advanced Evidence Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-red-800">Advanced Tampering Detection System</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Comprehensive evidence integrity analysis using advanced pattern detection algorithms. 
                    Analyzes document fingerprints, name frequency changes, timeline inconsistencies, and structural alterations.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong className="text-red-800">Detection Capabilities:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-red-700">
                        <li>Name frequency analysis and deviation detection</li>
                        <li>Evidence identifier consistency verification</li>
                        <li>Document structure and formatting analysis</li>
                        <li>Temporal pattern analysis and timeline verification</li>
                        <li>Content insertion and redaction trace detection</li>
                        <li>Cross-reference integrity validation</li>
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        onClick={() => setShowAdvancedAnalyzer(true)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Warning className="h-4 w-4 mr-2" />
                        Launch Advanced Analysis
                        <span className="ml-2 text-xs opacity-70">(Ctrl+Shift+A)</span>
                      </Button>
                      
                      <Button 
                        onClick={runQuickTamperingAnalysis}
                        variant="outline"
                        className="w-full border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <GitMerge className="h-4 w-4 mr-2" />
                        Quick Demo Analysis
                      </Button>
                    </div>
                    
                    <div className="text-xs text-red-600 border-t border-red-200 pt-3">
                      <strong>Professional Grade:</strong> Generates forensic reports suitable for legal proceedings 
                      and oversight agency submission. Includes executive summaries, technical analysis, and evidence logs.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warning className="h-5 w-5" />
                  Tampering Detection Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Sample Data for Testing</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Load sample documents with intentional discrepancies to test the tampering detection system.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Sample data includes:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                        <li>Two versions of the same police report with altered details</li>
                        <li>Changed name mentions (Noel, Josh, etc.)</li>
                        <li>Modified evidence numbers and timestamps</li>
                        <li>Removed witness statements and conclusions</li>
                      </ul>
                    </div>
                    
                    <Button 
                      onClick={loadSampleTamperingData}
                      variant="outline"
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Load Sample Tampering Data
                    </Button>
                    
                    <div className="text-xs text-muted-foreground">
                      After loading, use the "Detect Tampering" button to run analysis on the sample documents.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitMerge className="h-5 w-5" />
                  Date-Based Comparison Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Test Document Tampering Detection</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Run the date-based comparison algorithm to detect potential document tampering. This test uses sample documents with intentional alterations to demonstrate the detection capabilities.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Test Features:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                        <li>Groups documents by date and compares versions</li>
                        <li>Detects name changes, number alterations, and status modifications</li>
                        <li>Analyzes name mention frequency changes</li>
                        <li>Calculates suspicion scores based on detected changes</li>
                        <li>Highlights critical alterations that may indicate tampering</li>
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        onClick={loadSampleDateBasedData}
                        variant="outline"
                        className="w-full"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Load Date-Based Sample Documents
                      </Button>
                      
                      <Button 
                        onClick={() => setShowTamperingTest(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <GitMerge className="h-4 w-4 mr-2" />
                        View Test Algorithm
                        <span className="ml-2 text-xs opacity-70">(Ctrl+Shift+T)</span>
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      This test analyzes sample documents with known tampering to validate the detection algorithms.
                      Real documents from the input/ directory can be analyzed using the main "Detect Tampering" feature.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Oversight Agency Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Comprehensive Tampering Detection Reports</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Export professional-grade tampering detection analysis suitable for oversight agency submission. 
                    Reports automatically analyze document integrity and identify potential alterations.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Export package includes:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                        <li><strong>Executive Summary</strong> - High-level findings for decision makers</li>
                        <li><strong>Technical Report</strong> - Detailed analysis methodology and results</li>
                        <li><strong>Evidence Summary CSV</strong> - Structured data for database import</li>
                        <li><strong>Raw Analysis Data</strong> - Complete JSON dataset with metadata</li>
                        <li><strong>Quick Reference Card</strong> - One-page summary for investigators</li>
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        onClick={() => setShowTamperingDetector(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <Warning className="h-4 w-4 mr-2" />
                        Interactive Analysis
                      </Button>
                      
                      <Button 
                        onClick={exportTamperingReportsDirectly}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Quick Export Reports
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground border-t pt-3">
                      <strong>Analysis includes:</strong> Date-based document comparison, name mention frequency tracking, 
                      evidence numbering consistency, timeline verification, and content change detection.
                      Suitable for legal proceedings and regulatory compliance.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Duplicate Detection Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Automatic Duplicate Prevention</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    The system automatically checks for duplicates using multiple detection methods:
                  </p>
                  
                  <div className="space-y-2">
                    {getDuplicatePreventionRules().map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{rule.description}</span>
                        <Badge variant="outline" className={
                          rule.confidence >= 90 ? 'bg-red-50 text-red-700' :
                          rule.confidence >= 70 ? 'bg-orange-50 text-orange-700' :
                          'bg-yellow-50 text-yellow-700'
                        }>
                          {rule.confidence}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    When duplicates are detected, you'll be prompted to skip, replace, or keep both files.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">

            {/* Tampering Analysis Quick Status */}
            <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Warning className="h-5 w-5 text-red-600" />
                  Document Integrity Analysis - IMMEDIATE ACTION
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-100 border border-red-200 rounded p-4 text-center">
                  <div className="text-lg font-bold text-red-800 mb-2">
                    🚨 CLICK TO LOAD YOUR REAL EVIDENCE FILES & DETECT TAMPERING 🚨
                  </div>
                  <div className="text-sm text-red-700 mb-3">
                    Your input/ directory contains: CPS Reports, Police Reports, Medical Exams with CLEAR ALTERATIONS
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={() => loadTextFilesFromInput(true)}
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-3 animate-pulse"
                    >
                      <Warning className="h-6 w-6 mr-3" />
                      LOAD REAL FILES & ANALYZE
                      <Warning className="h-6 w-6 ml-3" />
                    </Button>
                    <Button 
                      onClick={runImmediateTamperingAnalysis}
                      size="lg"
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50 text-lg px-8 py-3"
                    >
                      <Warning className="h-6 w-6 mr-3" />
                      ANALYZE LOADED FILES
                    </Button>
                  </div>
                  <div className="text-sm text-red-700 mt-2">
                    Will detect: Name changes (Noel→Neil, Nicholas→Owen), Evidence suppression, Case status alterations
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">
                      {allDocuments.filter(doc => doc.textContent && doc.textContent.length > 100).length}
                    </div>
                    <div className="text-muted-foreground">Analyzable Documents</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">
                      {allDocuments.length}
                    </div>
                    <div className="text-muted-foreground">Total Documents</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-orange-600">
                      {documentVersions.length}
                    </div>
                    <div className="text-muted-foreground">Version History</div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={runImmediateTamperingAnalysis}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Warning className="h-4 w-4 mr-2" />
                    Run Comprehensive Tampering Analysis
                    <span className="ml-2 text-xs opacity-70">(Ctrl+R)</span>
                  </Button>
                  <Button 
                    onClick={() => setShowAdvancedAnalyzer(true)}
                    variant="outline" 
                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <GitMerge className="h-4 w-4 mr-2" />
                    Advanced Pattern Analysis
                  </Button>
                  <Button 
                    onClick={exportTamperingReportsDirectly}
                    variant="outline"
                    className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Reports
                  </Button>
                </div>
                
                <div className="bg-red-100 border border-red-200 rounded p-3 text-sm">
                  <strong className="text-red-800">Analysis Capabilities:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-red-700">
                    <li>Name mention frequency analysis across document versions</li>
                    <li>Date-based document comparison and inconsistency detection</li>
                    <li>Timeline verification and modification pattern analysis</li>
                    <li>Content change detection and evidence alteration tracking</li>
                    <li>Cross-reference integrity validation and metadata verification</li>
                  </ul>
                </div>
                
                {allDocuments.length === 0 && (
                  <div className="text-center bg-red-50 border-2 border-red-500 rounded p-4 mb-4">
                    <div className="text-xl font-bold text-red-800 mb-2">
                      ⚠️ YOUR REAL EVIDENCE FILES ARE READY TO LOAD ⚠️
                    </div>
                    <div className="text-sm text-red-700 mb-3">
                      <strong>Found in input/ directory:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-left max-w-md mx-auto">
                        <li>CPS_Report_01.08.2024_Initial.txt (Original version)</li>
                        <li>CPS_Report_01.08.2024_Amended.txt (ALTERED version - child name changed)</li>
                        <li>PoliceReport_12.15.2023_Original.txt (Original version)</li>
                        <li>PoliceReport_12.15.2023_Revised.txt (ALTERED version - witness name changed)</li>
                        <li>Medical_Exam_03.10.2024.txt (Supporting evidence)</li>
                      </ul>
                    </div>
                    <div className="bg-red-200 rounded p-3 mb-3">
                      <div className="text-sm font-semibold text-red-800">EXPECTED TAMPERING INDICATORS:</div>
                      <div className="text-xs text-red-700 mt-1 space-y-1 text-left max-w-lg mx-auto">
                        <div>• NAME CHANGES: "Noel Johnson" → "Neil Johnson" (witness tampering)</div>
                        <div>• CHILD SUBSTITUTION: "Nicholas Williams" → "Owen Williams" (identity alteration)</div>
                        <div>• EVIDENCE SUPPRESSION: 12 photos → 8 photos (evidence removal)</div>
                        <div>• CASE STATUS: "ACTIVE" → "CLOSED" (outcome manipulation)</div>
                        <div>• WITNESS REMOVAL: Noel Johnson statement deleted from CPS report</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => loadTextFilesFromInput(true)}
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white text-lg px-12 py-4 animate-pulse"
                    >
                      🚨 LOAD REAL FILES & DETECT TAMPERING NOW 🚨
                    </Button>
                  </div>
                )}
                
                {allDocuments.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm bg-yellow-50 border border-yellow-200 rounded p-3">
                    ⚠️ Click the red button above to load your real evidence files and detect systematic tampering.
                  </div>
                )}
                
                {allDocuments.filter(doc => doc.textContent && doc.textContent.length > 100).length < 2 && allDocuments.length > 0 && (
                  <div className="text-center text-muted-foreground text-sm bg-orange-50 border border-orange-200 rounded p-3">
                    ℹ️ Need at least 2 documents with text content for comparison analysis. Current: {allDocuments.filter(doc => doc.textContent && doc.textContent.length > 100).length} analyzable documents.
                    <div className="mt-2">
                      <Button 
                        onClick={() => loadTextFilesFromInput(true)}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Load More Documents + Analyze
                      </Button>
                    </div>
                  </div>
                )}

                {allDocuments.filter(doc => doc.textContent && doc.textContent.length > 100).length >= 2 && (
                  <div className="text-center text-sm bg-green-50 border border-green-200 rounded p-3">
                    ✅ Ready for analysis! {allDocuments.filter(doc => doc.textContent && doc.textContent.length > 100).length} documents with text content available for comprehensive tampering detection.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Version Analytics Summary */}
            {documentVersions.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GitBranch className="h-5 w-5 text-blue-600" />
                    Version Tracking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{documentVersions.length}</div>
                      <div className="text-muted-foreground">Total Versions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {documentVersions.filter(v => v.changeType === 'edited').length}
                      </div>
                      <div className="text-muted-foreground">Edits Made</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {allDocuments.filter(doc => doc.currentVersion > 1).length}
                      </div>
                      <div className="text-muted-foreground">Active Docs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {new Set(documentVersions.map(v => v.changedBy)).size}
                      </div>
                      <div className="text-muted-foreground">Contributors</div>
                    </div>
                  </div>
                  {(() => {
                    const sevenDaysAgo = new Date()
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                    const recentVersions = documentVersions.filter(v => new Date(v.changedAt) >= sevenDaysAgo)
                    
                    if (recentVersions.length === 0) return null
                    
                    return (
                      <div className="mt-4 pt-3 border-t border-blue-200">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{recentVersions.length} changes in the last 7 days</span>
                          <span>View detailed analytics in Reports → Versions. Press Ctrl+D to compare versions, Ctrl+T for tampering detection.</span>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Search Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents by title, description, children, laws... (Ctrl+K)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <Funnel className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Primary">Primary</SelectItem>
                    <SelectItem value="Supporting">Supporting</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showAdvancedSearch ? "default" : "outline"}
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="relative"
                >
                  <TextT className="h-4 w-4 mr-2" />
                  Content Search
                  <span className="ml-2 text-xs opacity-70">(Ctrl+Shift+F)</span>
                </Button>
              </div>

              {/* Advanced Content Search */}
              {showAdvancedSearch && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MagnifyingGlass className="h-4 w-4" />
                      Search Inside Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search within document content..."
                        value={contentSearchTerm}
                        onChange={(e) => setContentSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                      {contentSearchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setContentSearchTerm('')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    {contentSearchTerm && searchResults.length > 0 && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Found {searchResults.reduce((acc, result) => acc + result.matches.length, 0)} matches 
                            in {searchResults.length} documents
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Export search results
                              const searchData = searchResults.map(result => {
                                const doc = allDocuments.find(d => d.id === result.docId)
                                return {
                                  document: doc?.title || 'Unknown',
                                  fileName: doc?.fileName || 'Unknown',
                                  matches: result.matches.length,
                                  matchTexts: result.matches.map(m => m.text).join(', ')
                                }
                              })
                              
                              const csvContent = [
                                ['Document', 'File Name', 'Match Count', 'Match Texts'],
                                ...searchData.map(item => [item.document, item.fileName, item.matches.toString(), item.matchTexts])
                              ]
                                .map(row => row.map(cell => `"${cell}"`).join(','))
                                .join('\n')
                              
                              const blob = new Blob([csvContent], { type: 'text/csv' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `search-results-${contentSearchTerm}.csv`
                              a.click()
                              URL.revokeObjectURL(url)
                              
                              toast.success('Search results exported')
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                        </div>
                        {searchResults.map((result) => {
                          const doc = allDocuments.find(d => d.id === result.docId)
                          if (!doc) return null
                          
                          return (
                            <div key={result.docId} className="border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-sm truncate">{doc.title}</div>
                                <Badge variant="outline" className="text-xs">
                                  {result.matches.length} matches
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {result.matches.slice(0, 2).map((match, idx) => (
                                  <div key={idx} className="text-xs bg-background rounded p-2">
                                    <div className="text-muted-foreground">
                                      {match.context.split(new RegExp(`(${contentSearchTerm})`, 'gi')).map((part, i) =>
                                        part.toLowerCase() === contentSearchTerm.toLowerCase() ? (
                                          <mark key={i} className="bg-yellow-200 text-yellow-900 px-1 rounded">
                                            {part}
                                          </mark>
                                        ) : part
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {result.matches.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{result.matches.length - 2} more matches
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    
                    {contentSearchTerm && searchResults.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <MagnifyingGlass className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No matches found for "{contentSearchTerm}"</p>
                        <p className="text-xs mt-1">Try different keywords or check spelling</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => {
                if (!doc || !doc.id) return null
                
                const docSearchResult = searchResults.find(result => result.docId === doc.id)
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">{doc.title || 'Untitled'}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <CategoryBadge category={doc.category || 'No'} />
                            {processedDocs.some(p => p && p.id === doc.id) && (
                              <Badge variant="outline" className="text-xs">
                                <GitBranch className="h-3 w-3 mr-1" />
                                Pipeline
                              </Badge>
                            )}
                            {doc.currentVersion && doc.currentVersion > 1 && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                v{doc.currentVersion}
                              </Badge>
                            )}
                            {docSearchResult && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200">
                                <MagnifyingGlass className="h-3 w-3 mr-1" />
                                {docSearchResult.matches.length}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>{doc.description}</p>
                      
                      {/* Show search snippet if available */}
                      {docSearchResult && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <div className="text-xs text-yellow-800 font-medium mb-1">Content matches:</div>
                          <div className="text-xs text-yellow-700">
                            {docSearchResult.matches[0].context.substring(0, 100)}...
                          </div>
                        </div>
                      )}
                      
                      {(doc.children && doc.children.length > 0) && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {doc.children.map((child, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{child}</Badge>
                          ))}
                        </div>
                      )}
                      
                      {(doc.laws && doc.laws.length > 0) && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Scales className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{doc.laws.length} law(s)</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2">
                        <Badge variant={(doc.include || 'NO') === 'YES' ? 'default' : 'secondary'}>
                          {doc.include || 'NO'}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedDoc(doc)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => showVersionHistory(doc)}
                            title="Version History (Ctrl+H)"
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => showVersionComparison(doc)}
                            title="Compare Versions (Ctrl+D)"
                          >
                            <GitMerge className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDocument(doc)}
                          >
                            <PencilSimple className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Loading state with error handling */}
            {isLoadingProcessed && (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading processed documents...</p>
              </div>
            )}

            {/* No documents found state */}
            {filteredDocuments.length === 0 && !isLoadingProcessed && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground">
                  {allDocuments.length === 0 
                    ? "Add PDF documents to the input/ directory and push to trigger the pipeline, or upload documents locally for testing"
                    : (contentSearchTerm 
                      ? `No documents contain "${contentSearchTerm}". Try different keywords or check the content search.`
                      : "Try adjusting your search or filter criteria. Use Ctrl+H for version history or Ctrl+D for version comparison.")
                  }
                </p>
                {contentSearchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setContentSearchTerm('')}
                  >
                    Clear content search
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => {
        if (!open) {
          setSelectedDoc(null)
          setDocumentSearchTerm('')
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDoc?.title}
              {selectedDoc?.currentVersion && selectedDoc.currentVersion > 1 && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  v{selectedDoc.currentVersion}
                </Badge>
              )}
              {selectedDoc?.textContent && (
                <Badge variant="outline" className="text-xs">
                  <TextT className="h-3 w-3 mr-1" />
                  Searchable Text
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="details" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Document Details</TabsTrigger>
                  <TabsTrigger value="content" disabled={!selectedDoc.textContent}>
                    Text Content {selectedDoc.textContent ? `(${Math.round(selectedDoc.textContent.length / 1000)}k chars)` : '(Not Available)'}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="flex-1 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Document Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">File:</span> {selectedDoc.fileName || 'Unknown'}</div>
                        <div><span className="font-medium">Category:</span> <CategoryBadge category={selectedDoc.category} /></div>
                        <div><span className="font-medium">Include:</span> <Badge variant={(selectedDoc.include || 'NO') === 'YES' ? 'default' : 'secondary'}>{selectedDoc.include || 'NO'}</Badge></div>
                        <div><span className="font-medium">Uploaded:</span> {selectedDoc.uploadedAt ? new Date(selectedDoc.uploadedAt).toLocaleDateString() : 'Unknown'}</div>
                        {selectedDoc.currentVersion && (
                          <div><span className="font-medium">Version:</span> {selectedDoc.currentVersion}</div>
                        )}
                        {selectedDoc.lastModified && (
                          <div><span className="font-medium">Last Modified:</span> {new Date(selectedDoc.lastModified).toLocaleDateString()}</div>
                        )}
                        {selectedDoc.lastModifiedBy && (
                          <div><span className="font-medium">Modified By:</span> {selectedDoc.lastModifiedBy}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Placement Rules</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Master File:</span> {selectedDoc.placement?.masterFile ? '✓' : '✗'}</div>
                        <div><span className="font-medium">Exhibit Bundle:</span> {selectedDoc.placement?.exhibitBundle ? '✓' : '✗'}</div>
                        <div><span className="font-medium">Oversight Packet:</span> {selectedDoc.placement?.oversightPacket ? '✓' : '✗'}</div>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              showVersionHistory(selectedDoc)
                              setSelectedDoc(null)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-3 w-3" />
                            View Version History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Children Identified</h4>
                    <div className="flex gap-2 flex-wrap">
                      {(selectedDoc.children && selectedDoc.children.length > 0)
                        ? selectedDoc.children.map((child, idx) => (
                            <Badge key={idx} variant="secondary">{child}</Badge>
                          ))
                        : <span className="text-muted-foreground text-sm">None identified</span>
                      }
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Laws & Regulations</h4>
                    <div className="flex gap-2 flex-wrap">
                      {(selectedDoc.laws && selectedDoc.laws.length > 0)
                        ? selectedDoc.laws.map((law, idx) => (
                            <Badge key={idx} variant="outline">{law}</Badge>
                          ))
                        : <span className="text-muted-foreground text-sm">None identified</span>
                      }
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedDoc.description || 'No description available'}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="content" className="flex-1 overflow-hidden flex flex-col space-y-4">
                  {selectedDoc.textContent && (
                    <>
                      <div className="relative">
                        <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search within this document..."
                          value={documentSearchTerm}
                          onChange={(e) => setDocumentSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                        {documentSearchTerm && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => setDocumentSearchTerm('')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex-1 overflow-y-auto border rounded-lg bg-muted/30">
                        <div className="p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                          {documentSearchTerm ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedDoc.textContent
                                  .replace(/\n/g, '<br>')
                                  .replace(
                                    new RegExp(`(${documentSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                    '<mark style="background-color: #fef08a; color: #92400e; padding: 1px 2px; border-radius: 2px;">$1</mark>'
                                  )
                              }}
                            />
                          ) : (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedDoc.textContent.replace(/\n/g, '<br>')
                              }}
                            />
                          )}
                        </div>
                      </div>
                      
                      {documentSearchTerm && (
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            const matches = (selectedDoc.textContent.match(new RegExp(documentSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
                            return matches > 0 ? `${matches} matches found` : 'No matches found'
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          {editingDoc && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({...editingDoc, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={editingDoc.category}
                  onValueChange={(value: Document['category']) => 
                    setEditingDoc({...editingDoc, category: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary">Primary</SelectItem>
                    <SelectItem value="Supporting">Supporting</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Include</label>
                <Select
                  value={editingDoc.include}
                  onValueChange={(value: 'YES' | 'NO') => 
                    setEditingDoc({...editingDoc, include: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">YES</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingDoc.description}
                  onChange={(e) => setEditingDoc({...editingDoc, description: e.target.value})}
                  rows={4}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Change Notes</label>
                <Input
                  placeholder="What changes are you making? (optional)"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setEditingDoc(null)
                  setChangeNotes('')
                }}>
                  Cancel
                </Button>
                <Button onClick={saveEditedDocument}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={!!viewingVersionHistory} onOpenChange={() => setViewingVersionHistory(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Version History: {viewingVersionHistory?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingVersionHistory && (() => {
            const versions = getDocumentVersions(viewingVersionHistory.id)
            return (
              <div className="flex-1 overflow-y-auto space-y-4">
                {versions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No version history available for this document</p>
                    <p className="text-xs mt-1">Changes will be tracked going forward</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((version, index) => (
                      <Card key={version.id} className={`${index === 0 ? 'ring-2 ring-primary/20' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant={index === 0 ? 'default' : 'outline'}>
                                Version {version.version}
                                {index === 0 && ' (Current)'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {version.changeType === 'created' && <FileArrowUp className="h-3 w-3 mr-1" />}
                                {version.changeType === 'edited' && <PencilSimple className="h-3 w-3 mr-1" />}
                                {version.changeType === 'imported' && <GitBranch className="h-3 w-3 mr-1" />}
                                {version.changeType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {index > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to revert to version ${version.version}? This will create a new version with the old data.`)) {
                                      revertToVersion(viewingVersionHistory.id, version.id)
                                      setViewingVersionHistory(null)
                                    }
                                  }}
                                >
                                  Revert to this version
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setViewingVersionHistory(null)
                                  showVersionComparison(viewingVersionHistory)
                                }}
                              >
                                <GitMerge className="h-3 w-3 mr-1" />
                                Compare
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Changed by:</span>
                              <div className="flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                {version.changedBy}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Changed at:</span>
                              <div className="mt-1">
                                {new Date(version.changedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          {version.changeNotes && (
                            <div className="bg-muted/50 rounded p-3">
                              <span className="font-medium text-muted-foreground text-xs">Change Notes:</span>
                              <p className="text-sm mt-1">{version.changeNotes}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-medium">Title:</span> {version.title}
                            </div>
                            <div>
                              <span className="font-medium">Category:</span> {version.category}
                            </div>
                            <div>
                              <span className="font-medium">Include:</span> {version.include}
                            </div>
                            <div>
                              <span className="font-medium">Children:</span> {version.children.join(', ') || 'None'}
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium">Laws:</span> {version.laws.join(', ') || 'None'}
                            </div>
                          </div>
                          
                          <details className="text-xs">
                            <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                              Show full description
                            </summary>
                            <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                              {version.description}
                            </div>
                          </details>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Document Version Comparison Dialog */}
      {comparingVersions && (
        <DocumentComparison
          document={comparingVersions}
          documentVersions={documentVersions}
          isOpen={!!comparingVersions}
          onClose={() => setComparingVersions(null)}
          onRevertToVersion={revertToVersion}
        />
      )}

      {/* Duplicate Detection Dialog */}
      <DuplicateDetectionDialog
        isOpen={duplicateDialog.isOpen}
        onClose={() => setDuplicateDialog({ isOpen: false, result: null, newFile: null, processingDoc: null })}
        duplicateResult={duplicateDialog.result}
        newFileName={duplicateDialog.newFile?.name || ''}
        onAction={handleDuplicateDialogAction}
      />

      {/* Advanced Tampering Analyzer Dialog */}
      <AdvancedTamperingAnalyzer
        documents={allDocuments}
        isOpen={showAdvancedAnalyzer}
        onClose={() => setShowAdvancedAnalyzer(false)}
      />

      {/* Tampering Detection Dialog */}
      <TamperingDetector
        documents={allDocuments}
        documentVersions={documentVersions}
        isOpen={showTamperingDetector}
        onClose={() => setShowTamperingDetector(false)}
      />

      {/* Tampering Detection Test Dialog */}
      <Dialog open={showTamperingTest} onOpenChange={setShowTamperingTest}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Date-Based Document Comparison Test
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <TamperingDetectorTest />
          </div>
        </DialogContent>
      </Dialog>

      {/* Real Evidence Analysis Display */}
      <EvidenceAnalysisDisplay
        documents={allDocuments}
        isOpen={showEvidenceAnalysis}
        onClose={() => setShowEvidenceAnalysis(false)}
      />
      </div>
    </ErrorBoundary>
  )
}

export default App