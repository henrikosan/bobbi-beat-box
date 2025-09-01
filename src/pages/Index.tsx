import React from 'react';
import SimpleBobbiCussion from '../components/SimpleBobbiCussion';

const Index = () => {
  console.log('Index component rendering...');
  
  try {
    return (
      <div>
        <h1 style={{color: 'white', padding: '20px'}}>Loading BobbiCussion...</h1>
        <SimpleBobbiCussion />
      </div>
    );
  } catch (error) {
    console.error('Error rendering BobbiCussion:', error);
    return <div style={{color: 'red', padding: '20px'}}>Error: {String(error)}</div>;
  }
};

export default Index;