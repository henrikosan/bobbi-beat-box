import React from 'react';

const SimpleBobbiCussion = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 tracking-wide">
            BobbiCussion
          </h1>
          <p className="text-muted-foreground text-lg">
            Modular Percussion Synthesizer
          </p>
        </header>
        
        <div className="rack-panel p-6">
          <p className="text-foreground">Synthesizer interface loading...</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleBobbiCussion;