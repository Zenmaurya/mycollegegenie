import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Loader2, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, AlertCircle, ZoomIn, ZoomOut, RotateCcw, BookOpen, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Resource } from '../types';
import { getResources } from '../services/resourceService';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const Page = React.forwardRef<HTMLDivElement, { pageNumber: number; image: string; isHardcover?: boolean }>(
  (props, ref) => {
    return (
      <div 
        className={`bg-white overflow-hidden relative ${props.isHardcover ? 'border-l border-gray-300' : ''}`} 
        ref={ref}
        data-density={props.isHardcover ? "hard" : "soft"}
      >
        {/* Page Shadow/Gradient for 3D effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/10 via-transparent to-transparent w-8 z-10" />
        <div className="absolute inset-y-0 right-0 pointer-events-none bg-gradient-to-l from-black/5 via-transparent to-transparent w-8 z-10" />
        
        {props.isHardcover && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/20 to-transparent w-12 z-20" />
        )}

        <img 
          src={props.image} 
          alt={`Page ${props.pageNumber}`} 
          className="w-full h-full object-contain bg-white" 
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
);

export const FlipbookPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isSinglePage, setIsSinglePage] = useState(false);
  const flipBookRef = useRef<any>(null);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const allResources = await getResources(true);
        const found = allResources.find(r => r.id === id);
        if (found) {
          setResource(found);
          loadPdf(found.directDownloadLink || found.link || '');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching resource:', error);
        setLoading(false);
      }
    };
    fetchResource();
  }, [id]);

  const loadPdf = async (url: string) => {
    if (!url) {
      setLoading(false);
      return;
    }

    let finalUrl = url;
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/(.+?)\//);
      if (match && match[1]) {
        finalUrl = `https://docs.google.com/uc?export=download&id=${match[1]}`;
      }
    }

    try {
      const loadingTask = pdfjs.getDocument(finalUrl);
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const pageImages: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport, canvas }).promise;
          pageImages.push(canvas.toDataURL('image/jpeg', 0.8));
        }
      }

      setPages(pageImages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const playFlipSound = useCallback(() => {
    try {
      const audio = new Audio('https://actions.google.com/sounds/v1/foley/book_page_flip.ogg');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  }, []);

  const onPage = useCallback((e: any) => {
    setCurrentPage(e.data);
    playFlipSound();
  }, [playFlipSound]);

  const onChangeState = useCallback((e: any) => {
    if (e.data === 'flipping') {
      setIsFlipping(true);
    } else {
      setIsFlipping(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        flipBookRef.current?.pageFlip().flipNext();
      } else if (e.key === 'ArrowLeft') {
        flipBookRef.current?.pageFlip().flipPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-6"
        >
          <Loader2 className="w-16 h-16 text-brand-primary" />
        </motion.div>
        <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Magic in Progress</h2>
        <p className="text-gray-400 font-medium animate-pulse">Converting your document into a Flipbook...</p>
      </div>
    );
  }

  if (!resource || pages.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Resource Not Found</h1>
        <p className="text-gray-400 mb-6">The resource you are looking for might have been removed or the link is invalid.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-8 py-4 bg-brand-primary rounded-2xl font-black uppercase tracking-widest hover:bg-brand-primary transition-all shadow-xl shadow-brand-primary/20"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative bg-transparent">
      <Helmet>
        <title>{resource ? `${resource.title} - Flipbook | MyCollegeGenie` : 'Flipbook | MyCollegeGenie'}</title>
        <meta name="description" content="Read study materials and notes in our interactive flipbook viewer." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-start justify-between z-50 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => window.history.length > 2 ? navigate(-1) : navigate('/')}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-red-600 hover:bg-red-700 backdrop-blur-xl rounded-xl transition-all text-white shadow-xl flex items-center gap-2 border border-red-500/50"
            title="Close Flipbook"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Close Flipbook</span>
          </button>
          <div className="bg-[#1a1a1a]/80 backdrop-blur-xl px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border border-white/10 shadow-2xl hidden md:block">
            <h1 className="text-white font-bold text-sm sm:text-base line-clamp-1">{resource.title}</h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black">{resource.type} • {resource.course}</p>
          </div>
        </div>
        
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          <button 
            onClick={toggleFullscreen}
            className="p-3 bg-[#1a1a1a]/80 hover:bg-white/10 backdrop-blur-xl rounded-xl transition-all text-white border border-white/10 shadow-xl hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          {resource.directDownloadLink && (
            <a 
              href={resource.directDownloadLink}
              download
              className="p-3 bg-[#1a1a1a]/80 hover:bg-white/10 backdrop-blur-xl rounded-xl transition-all text-white border border-white/10 shadow-xl hidden sm:flex"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>

      {/* Flipbook Container with Zoom */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent wrapperClass="!w-full !h-full flex-1" contentClass="!w-full !h-full flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center p-4 sm:p-12 relative">
                  {/* Background Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

                  <div className={`w-full h-full max-w-6xl mx-auto flex items-center justify-center transition-all duration-300 ${isFlipping ? 'scale-[0.99]' : 'scale-100'}`}>
                    {/* @ts-ignore */}
                    <HTMLFlipBook
                      key={isSinglePage ? 'single' : 'double'}
                      width={550}
                      height={733}
                      size="stretch"
                      minWidth={280}
                      maxWidth={1000}
                      minHeight={350}
                      maxHeight={1533}
                      maxShadowOpacity={0.4}
                      showCover={true}
                      mobileScrollSupport={true}
                      usePortrait={isSinglePage}
                      drawShadow={true}
                      flippingTime={600}
                      swipeDistance={30}
                      onFlip={onPage}
                      onChangeState={onChangeState}
                      className="shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500"
                      ref={flipBookRef}
                      style={{ margin: '0 auto' }}
                    >
                      {pages.map((image, index) => (
                        <Page 
                          key={index} 
                          pageNumber={index + 1} 
                          image={image} 
                          isHardcover={index === 0 || index === pages.length - 1}
                        />
                      ))}
                    </HTMLFlipBook>
                  </div>
                </div>
              </TransformComponent>

              {/* Floating Controls */}
              <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-[#1a1a1a]/80 backdrop-blur-xl px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border border-white/10 shadow-2xl z-50">
                <button 
                  onClick={() => flipBookRef.current?.pageFlip().flipPrev()}
                  disabled={currentPage === 0}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white disabled:opacity-30"
                  title="Previous Page (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                
                <div className="text-white font-black text-xs sm:text-sm tracking-[0.2em] uppercase px-2 whitespace-nowrap">
                  {currentPage + 1} <span className="text-gray-500 mx-1">/</span> {pages.length}
                </div>
                
                <button 
                  onClick={() => flipBookRef.current?.pageFlip().flipNext()}
                  disabled={currentPage === pages.length - 1}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white disabled:opacity-30"
                  title="Next Page (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="w-px h-6 bg-white/20 mx-1 sm:mx-2" />

                <button onClick={() => zoomOut()} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors hidden sm:block" title="Zoom Out">
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button onClick={() => zoomIn()} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors hidden sm:block" title="Zoom In">
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button onClick={() => resetTransform()} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors hidden sm:block" title="Reset Zoom">
                  <RotateCcw className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-white/20 mx-1 sm:mx-2 hidden sm:block" />

                <button 
                  onClick={() => setIsSinglePage(!isSinglePage)} 
                  className={`p-2 rounded-lg transition-colors hidden sm:block ${isSinglePage ? 'bg-brand-primary text-white' : 'hover:bg-white/10 text-white'}`}
                  title={isSinglePage ? "Switch to Double Page" : "Switch to Single Page"}
                >
                  {isSinglePage ? <FileText className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-white/5 w-full relative z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-brand-primary to-indigo-500 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

