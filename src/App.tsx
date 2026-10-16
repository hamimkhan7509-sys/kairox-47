/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, PageId } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SkinGeneratorPage } from './pages/SkinGeneratorPage';
import { TextureGeneratorPage } from './pages/TextureGeneratorPage';
import { AddonGeneratorPage } from './pages/AddonGeneratorPage';
import { StructureGeneratorPage } from './pages/StructureGeneratorPage';
import { WorldGeneratorPage } from './pages/WorldGeneratorPage';
import { InstallGuidePage } from './pages/InstallGuidePage';
import { MyCreationsPage } from './pages/MyCreationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { LegalPage } from './pages/LegalPages';
import { UserSettings, DEFAULT_SETTINGS, STORAGE_KEYS } from './config';
import { SavedCreation } from './types';
import { WifiOff } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Settings State from localStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore error
    }
    return DEFAULT_SETTINGS;
  });

  // Creations History from localStorage
  const [creations, setCreations] = useState<SavedCreation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREATIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore error
    }
    return [];
  });

  // Save settings when changed
  const handleUpdateSettings = (newPartial: Partial<UserSettings>) => {
    const updated = { ...settings, ...newPartial };
    setSettings(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch {
      // Ignore error
    }
  };

  // Add new creation
  const handleSaveCreation = (newCreation: SavedCreation) => {
    const updated = [newCreation, ...creations.filter((c) => c.id !== newCreation.id)].slice(0, 50);
    setCreations(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CREATIONS, JSON.stringify(updated));
    } catch {
      // Ignore error
    }
  };

  // Delete creation
  const handleDeleteCreation = (id: string) => {
    const updated = creations.filter((c) => c.id !== id);
    setCreations(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CREATIONS, JSON.stringify(updated));
    } catch {
      // Ignore error
    }
  };

  // Clear all creations
  const handleClearHistory = () => {
    setCreations([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.CREATIONS);
    } catch {
      // Ignore error
    }
  };

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-emerald-500 selection:text-black font-sans">
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 font-medium z-50">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. Local creations and downloads remain accessible.</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        creationsCount={creations.length}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={(page) => setCurrentPage(page)}
            recentCreations={creations}
            onOpenCreation={() => {
              setCurrentPage('creations');
            }}
          />
        )}

        {currentPage === 'generator-skin' && (
          <SkinGeneratorPage
            userSettings={settings}
            onSaveCreation={handleSaveCreation}
          />
        )}

        {currentPage === 'generator-texture' && (
          <TextureGeneratorPage
            userSettings={settings}
            onSaveCreation={handleSaveCreation}
          />
        )}

        {currentPage === 'generator-addon' && (
          <AddonGeneratorPage
            userSettings={settings}
            onSaveCreation={handleSaveCreation}
          />
        )}

        {currentPage === 'generator-structure' && (
          <StructureGeneratorPage
            userSettings={settings}
            onSaveCreation={handleSaveCreation}
          />
        )}

        {currentPage === 'generator-world' && (
          <WorldGeneratorPage
            userSettings={settings}
            onSaveCreation={handleSaveCreation}
          />
        )}

        {currentPage === 'install-guide' && <InstallGuidePage />}

        {currentPage === 'creations' && (
          <MyCreationsPage
            creations={creations}
            onDeleteCreation={handleDeleteCreation}
            onClearAll={handleClearHistory}
            onNavigate={(page) => setCurrentPage(page)}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClearHistory={handleClearHistory}
          />
        )}

        {currentPage === 'about' && <AboutPage />}

        {currentPage === 'terms' && <LegalPage type="terms" />}

        {currentPage === 'privacy' && <LegalPage type="privacy" />}
      </main>

      {/* Site Footer */}
      <Footer onNavigate={(page) => setCurrentPage(page)} />
    </div>
  );
}
