import React from 'react';
import BobbiCussion from '../components/BobbiCussion';

const Index = () => {
  console.log('Index component rendering v2...');
  
  try {
    return (
      <div>
        <h1 style={{color: 'white', padding: '20px'}}>DEBUG: Testing BobbiCussion v2...</h1>
        <BobbiCussion />
      </div>
    );
  } catch (error) {
    console.error('Error rendering BobbiCussion:', error);
    return <div style={{color: 'red', padding: '20px'}}>Error: {String(error)}</div>;
  }
};

export default Index;